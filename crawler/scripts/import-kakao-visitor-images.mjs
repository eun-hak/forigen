import fs from "node:fs/promises";

const outputRoot = new URL("../output/", import.meta.url);
const envText = await fs.readFile(new URL("../../.env", import.meta.url), "utf8");
const env = Object.fromEntries(envText.split(/\r?\n/).filter((line) => line && !line.startsWith("#") && line.includes("=")).map((line) => {
  const index = line.indexOf("=");
  return [line.slice(0, index), line.slice(index + 1)];
}));
const base = env.SUPABASE_URL;
const key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
if (!base || !key) throw new Error("Supabase credentials are missing");
const headers = { apikey: key, "Content-Type": "application/json" };
const request = async (path, init = {}) => {
  const response = await fetch(`${base}/rest/v1/${path}`, { ...init, headers: { ...headers, ...init.headers } });
  if (!response.ok) throw new Error(`${response.status} ${path}: ${await response.text()}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

const shortlist = JSON.parse(await fs.readFile(new URL("research-shortlist-final.json", outputRoot), "utf8")).slice(0, 200);
const candidates = JSON.parse(await fs.readFile(new URL("kakao-visitor-image-candidates.json", outputRoot), "utf8"));
const places = await request("places?select=id,external_key&limit=1000");
const placeByKey = new Map(places.map((place) => [place.external_key, place]));
const existing = await request("place_attributes?attribute_type=eq.hero_image&select=place_id");
const existingPlaceIds = new Set(existing.map((item) => item.place_id));

const rows = candidates.flatMap((candidate) => {
  const image = candidate.images?.[0];
  const sourcePlace = shortlist[candidate.i];
  const databasePlace = sourcePlace ? placeByKey.get(sourcePlace.externalKey) : null;
  if (!image || !databasePlace || existingPlaceIds.has(databasePlace.id)) return [];
  return [{
    place_id: databasePlace.id,
    attribute_type: "hero_image",
    value_json: {
      url: image.src,
      sourceUrl: `https://place.map.kakao.com/${candidate.id}`,
      altKo: `${sourcePlace.nameKo} 카카오맵 방문 사진`,
      altEn: `Visitor photo for ${sourcePlace.nameKo}`,
      kind: "kakao_visitor",
      kakaoPlaceId: candidate.id,
    },
    evidence_text: "카카오맵 장소 대표 갤러리 방문·블로그 사진",
    verification_status: "community_source",
    confidence: 0.85,
    verified_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }];
});

if (!process.argv.includes("--dry-run") && rows.length) {
  await request("place_attributes?on_conflict=place_id,attribute_type", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows),
  });
}
console.log(JSON.stringify({ researched: candidates.length, withVisitorPhoto: candidates.filter((item) => item.images?.length).length, imported: rows.length, existingImagesPreserved: existing.length }, null, 2));
