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
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(batch),
    });
    if (!response.ok) throw new Error(`Supabase upload failed: ${response.status} ${await response.text()}`);
    uploaded += batch.length;
  }
  return uploaded;
}
