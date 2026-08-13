import fs from "node:fs/promises";

const root = new URL("../output/", import.meta.url);
const envText = await fs.readFile(new URL("../../.env", import.meta.url), "utf8");
const env = Object.fromEntries(envText.split(/\r?\n/).filter((line) => line && !line.startsWith("#") && line.includes("=")).map((line) => {
  const index = line.indexOf("=");
  return [line.slice(0, index), line.slice(index + 1)];
}));
const base = env.SUPABASE_URL;
const key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
if (!base || !key) throw new Error("Supabase credentials are missing");
const headers = { apikey: key, "Content-Type": "application/json" };
const read = async (name) => JSON.parse(await fs.readFile(new URL(name, root), "utf8"));
const request = async (path, init = {}) => {
  const response = await fetch(`${base}/rest/v1/${path}`, { ...init, headers: { ...headers, ...init.headers } });
  if (!response.ok) throw new Error(`${response.status} ${path}: ${await response.text()}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

const shortlist = (await read("research-shortlist-final.json")).slice(0, 200);
const results = new Map();
const batch = await read("naver-manual-batch-raw.json");
batch.forEach((result, offset) => results.set(12 + offset, result));
for (const name of ["naver-manual-retry-raw.json", "naver-manual-retry-rest-raw.json", "naver-manual-097-146-raw.json", "naver-manual-130-159-raw.json", "naver-manual-160-199-raw.json"]) {
  for (const item of await read(name)) results.set(item.idx, item.result);
}

const curated = await read("naver-manual-research.json");
const curatedByName = new Map(curated.map((item) => [item.nameKo, item]));
const addressRechecks = new Map((await read("naver-address-recheck.json")).map((item) => [item.idx, item]));
const searchRechecks = new Map((await read("naver-no-suggestion-recheck.json")).map((item) => [item.idx, item]));
const priceNumbers = (raw = []) => raw.flatMap((line) => [...line.matchAll(/\b(\d{1,3}(?:,\d{3})+)\b/g)].map((match) => Number(match[1].replaceAll(",", "")))).filter((value) => value >= 1000 && value <= 10_000_000);

const records = shortlist.map((place, idx) => {
  const raw = results.get(idx);
  const curatedItem = curatedByName.get(place.nameKo);
  const addressCheck = addressRechecks.get(idx);
  const searchCheck = searchRechecks.get(idx);
  const prices = priceNumbers(raw?.raw);
  const searchBest = searchCheck?.best;
  const naverId = curatedItem?.naverPlaceId || raw?.id || searchBest?.id || null;
  const matched = Boolean(curatedItem || addressCheck?.actual || searchCheck?.status === "matched" || searchCheck?.status === "matched_in_results" || raw?.status === "matched");
  const addressVerified = Boolean(curatedItem?.matchedAddress || addressCheck?.status === "match" || searchBest?.roadMatch || searchCheck?.status === "matched_in_results" || raw?.addressMatch === true);
  const actualAddress = curatedItem?.matchedAddress || addressCheck?.actual || searchBest?.actual || raw?.addressLine || null;
  return {
    idx, place, naverId, matched, addressVerified, actualAddress,
    sourceUrl: curatedItem?.sourceUrl || raw?.sourceUrl || (naverId ? `https://map.naver.com/p/entry/place/${naverId}` : matched ? `https://map.naver.com/p/search/${encodeURIComponent(searchCheck?.query || place.nameKo)}` : null),
    minPrice: curatedItem?.minPrice ?? (prices.length ? Math.min(...prices) : null),
    maxPrice: curatedItem?.maxPrice ?? (prices.length ? Math.max(...prices) : null),
    durationMin: curatedItem?.durationMin ?? null,
    durationMax: curatedItem?.durationMax ?? null,
    priceNote: curatedItem?.priceNote ?? (prices.length ? "네이버 지도 공개 가격표에서 확인한 범위" : null),
    checkedAt: curatedItem?.checkedAt ? `${curatedItem.checkedAt}T00:00:00+09:00` : "2026-08-13T00:00:00+09:00",
  };
});

const places = await request("places?select=id,external_key,name_ko&limit=1000");
const placeByKey = new Map(places.map((place) => [place.external_key, place]));
const services = await request("services?select=id,code");
const serviceByCode = new Map(services.map((service) => [service.code, service.id]));
const resolved = records.map((record) => ({ ...record, databasePlace: placeByKey.get(record.place.externalKey) })).filter((record) => record.databasePlace);
const matched = resolved.filter((record) => record.matched && record.sourceUrl);

if (process.argv.includes("--dry-run")) {
  console.log(JSON.stringify({ shortlist: records.length, databaseMatches: resolved.length, naverMatches: matched.length, addressVerified: resolved.filter((x) => x.addressVerified).length, withPrices: resolved.filter((x) => x.minPrice != null).length }, null, 2));
  process.exit(0);
}

const ids = matched.map((record) => record.databasePlace.id);
if (ids.length) await request(`sources?source_type=eq.naver_manual&place_id=in.(${ids.join(",")})`, { method: "DELETE", headers: { Prefer: "return=minimal" } });

const sourceRows = matched.map((record) => ({
  place_id: record.databasePlace.id,
  source_type: "naver_manual",
  source_url: record.sourceUrl,
  title: record.naverId ? `Naver Place ${record.naverId}` : "Naver Map search result",
  captured_text: record.actualAddress ? `주소: ${record.actualAddress}` : "네이버 장소 검색 결과 확인",
  checked_at: record.checkedAt,
}));
for (let i = 0; i < sourceRows.length; i += 50) await request("sources", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(sourceRows.slice(i, i + 50)) });

const sourceLookup = await request(`sources?source_type=eq.naver_manual&place_id=in.(${ids.join(",")})&select=id,place_id`);
const sourceByPlace = new Map(sourceLookup.map((source) => [source.place_id, source.id]));
const attributeRows = matched.flatMap((record) => {
  const common = { place_id: record.databasePlace.id, verification_status: "official_source", confidence: record.addressVerified ? 0.98 : 0.75, source_id: sourceByPlace.get(record.databasePlace.id), verified_at: record.checkedAt, updated_at: new Date().toISOString() };
  const rows = [{ ...common, attribute_type: "naver_listing", value_json: { value: true, placeId: record.naverId, addressVerified: record.addressVerified, actualAddress: record.actualAddress }, evidence_text: record.addressVerified ? "네이버 지도 도로명·번지 일치" : "네이버 지도 장소 검색 결과 확인" }];
  if (record.minPrice != null) rows.push({ ...common, attribute_type: "price_confirmed", value_json: { value: true }, evidence_text: record.priceNote });
  return rows;
});
for (let i = 0; i < attributeRows.length; i += 50) await request("place_attributes?on_conflict=place_id,attribute_type", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(attributeRows.slice(i, i + 50)) });

const serviceRows = resolved.map((record) => ({
  place_id: record.databasePlace.id,
  service_id: serviceByCode.get(record.place.primaryCategory),
  min_price: record.minPrice,
  max_price: record.maxPrice,
  duration_min: record.durationMin,
  duration_max: record.durationMax,
  price_note: record.priceNote,
  verified_at: record.minPrice != null || record.priceNote ? record.checkedAt : null,
})).filter((row) => row.service_id && (row.min_price != null || row.max_price != null || row.duration_min != null || row.duration_max != null || row.price_note));
for (let i = 0; i < serviceRows.length; i += 50) await request("place_services?on_conflict=place_id,service_id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(serviceRows.slice(i, i + 50)) });

console.log(JSON.stringify({ placesProcessed: resolved.length, sourcesInserted: sourceRows.length, attributesUpserted: attributeRows.length, servicesUpserted: serviceRows.length, addressVerified: resolved.filter((x) => x.addressVerified).length, withPrices: resolved.filter((x) => x.minPrice != null).length }, null, 2));
