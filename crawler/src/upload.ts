import type { Config } from "./config.js";
import type { CrawlCandidate } from "./domain.js";

function toDatabaseRow(candidate: CrawlCandidate): Record<string, unknown> {
  return {
    external_key: candidate.externalKey,
    place_name: candidate.placeName,
    source_url: candidate.sourceUrl ?? null,
    raw_data: candidate.rawData,
    extracted_data: candidate.extractedData,
    evidence_text: candidate.evidenceText ?? null,
    confidence: candidate.confidence,
    status: "pending",
  };
}

export async function uploadCandidates(candidates: readonly CrawlCandidate[], config: Config): Promise<number> {
  const apiKey = config.SUPABASE_SECRET_KEY ?? config.SUPABASE_SERVICE_ROLE_KEY;
  if (!config.SUPABASE_URL || !apiKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY) are required for upload");
  }
  const isLegacyJwt = apiKey.split(".").length === 3;
  let uploaded = 0;
  for (let index = 0; index < candidates.length; index += 20) {
    const batch = candidates.slice(index, index + 20).map(toDatabaseRow);
    const response = await fetch(`${config.SUPABASE_URL}/rest/v1/crawl_candidates?on_conflict=external_key`, {
      method: "POST",
      headers: {
        apikey: apiKey,
        ...(isLegacyJwt ? { Authorization: `Bearer ${apiKey}` } : {}),
        "Content-Type": "application/json",
        Prefer: "resolution=ignore-duplicates,return=representation",
      },
      body: JSON.stringify(batch),
    });
    if (!response.ok) throw new Error(`Supabase upload failed: ${response.status} ${await response.text()}`);
    const inserted = await response.json() as unknown[];
    uploaded += inserted.length;
  }
  return uploaded;
}

export async function syncApprovedEnrichment(candidates: readonly CrawlCandidate[], config: Config): Promise<Record<string, number>> {
  const apiKey = config.SUPABASE_SECRET_KEY ?? config.SUPABASE_SERVICE_ROLE_KEY;
  if (!config.SUPABASE_URL || !apiKey) throw new Error("Supabase configuration is required for enrichment sync");
  const headers = { apikey: apiKey, "Content-Type": "application/json" };
  const [placesResponse, approvedResponse] = await Promise.all([
    fetch(`${config.SUPABASE_URL}/rest/v1/places?select=id,external_key&limit=1000`, { headers }),
    fetch(`${config.SUPABASE_URL}/rest/v1/crawl_candidates?status=eq.approved&select=external_key&limit=1000`, { headers }),
  ]);
  if (!placesResponse.ok) throw new Error(`Place lookup failed: ${await placesResponse.text()}`);
  if (!approvedResponse.ok) throw new Error(`Candidate lookup failed: ${await approvedResponse.text()}`);
  const places = await placesResponse.json() as Array<{ id: string; external_key: string | null }>;
  const approved = new Set((await approvedResponse.json() as Array<{ external_key: string }>).map((item) => item.external_key));
  const placeIds = new Map(places.flatMap((item) => item.external_key ? [[item.external_key, item.id] as const] : []));
  const socialRows: Record<string, unknown>[] = []; const channelRows: Record<string, unknown>[] = [];
  const menuRows: Record<string, unknown>[] = []; const hourRows: Record<string, unknown>[] = [];
  let candidatesSynced = 0;
  for (const candidate of candidates) {
    const placeId = placeIds.get(candidate.externalKey); const place = candidate.extractedData.place;
    if (!placeId || !approved.has(candidate.externalKey)) continue;
    const patch = await fetch(`${config.SUPABASE_URL}/rest/v1/crawl_candidates?external_key=eq.${encodeURIComponent(candidate.externalKey)}`, { method: "PATCH", headers: { ...headers, Prefer: "return=minimal" }, body: JSON.stringify({ extracted_data: candidate.extractedData, raw_data: candidate.rawData, evidence_text: candidate.evidenceText ?? null, confidence: candidate.confidence }) });
    if (!patch.ok) throw new Error(`Candidate sync failed: ${patch.status} ${await patch.text()}`);
    candidatesSynced += 1;
    for (const item of place.socialAccounts ?? []) socialRows.push({ place_id: placeId, platform: item.platform, handle: item.handle ?? null, profile_url: item.profileUrl, confidence: item.confidence, verification_status: "verified", checked_at: item.checkedAt });
    for (const item of place.bookingChannels ?? []) channelRows.push({ place_id: placeId, channel_type: item.channelType, channel_url: item.url ?? null, channel_value: item.value ?? null, confidence: item.confidence, verification_status: "verified", checked_at: item.checkedAt });
    for (const item of place.menuItems ?? []) menuRows.push({ place_id: placeId, name: item.name, price: item.price, currency: item.currency, evidence_text: item.evidenceText, source_url: item.sourceUrl, confidence: item.confidence, verification_status: "verified", checked_at: item.checkedAt });
    if (place.openingHoursText) hourRows.push({ place_id: placeId, hours_text: place.openingHoursText, confidence: 0.7, verification_status: "verified", checked_at: new Date().toISOString() });
  }
  async function upsert(table: string, conflict: string, rows: Record<string, unknown>[]) {
    if (!rows.length) return 0;
    const response = await fetch(`${config.SUPABASE_URL}/rest/v1/${table}?on_conflict=${conflict}`, { method: "POST", headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(rows) });
    if (!response.ok) throw new Error(`${table} sync failed: ${response.status} ${await response.text()}`);
    return rows.length;
  }
  return { candidates: candidatesSynced, socials: await upsert("place_social_accounts", "place_id,platform,profile_url", socialRows), channels: await upsert("place_booking_channels", "place_id,channel_type,channel_url", channelRows), menus: await upsert("place_menu_items", "place_id,name,price", menuRows), hours: await upsert("place_opening_hours", "place_id", hourRows) };
}
