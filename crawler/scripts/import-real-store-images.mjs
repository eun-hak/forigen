import fs from "node:fs/promises";

const outputRoot = new URL("../output/", import.meta.url);
const envText = await fs.readFile(new URL("../../.env", import.meta.url), "utf8");
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);

const base = env.SUPABASE_URL;
const key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
if (!base || !key) throw new Error("Supabase credentials are missing");
const headers = { apikey: key, "Content-Type": "application/json" };
const request = async (path, init = {}) => {
  const response = await fetch(`${base}/rest/v1/${path}`, {
    ...init,
    headers: { ...headers, ...init.headers },
  });
  if (!response.ok) throw new Error(`${response.status} ${path}: ${await response.text()}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

const shortlist = JSON.parse(
  await fs.readFile(new URL("research-shortlist-final.json", outputRoot), "utf8"),
).slice(0, 200);
const candidates = JSON.parse(
  await fs.readFile(new URL("naver-real-image-candidates.json", outputRoot), "utf8"),
);
const places = await request("places?select=id,external_key,name_ko&limit=1000");
const placeByKey = new Map(places.map((place) => [place.external_key, place]));
const existing = await request(
  "place_attributes?attribute_type=eq.hero_image&select=place_id,value_json",
);
const existingByPlace = new Map(existing.map((item) => [item.place_id, item.value_json]));

const reject = /(?:qr|qrcode|menu|price|coupon|event|logo|banner)/i;
const selectImage = (images) => {
  const usable = images.filter((image) => image.src && !reject.test(decodeURIComponent(image.src)));
  return usable.find((image) => image.src.includes("ldb-phinf")) || usable[0] || null;
};

const rows = candidates.flatMap((candidate) => {
  const image = selectImage(candidate.images || []);
  const sourcePlace = shortlist[candidate.index];
  const databasePlace = sourcePlace ? placeByKey.get(sourcePlace.externalKey) : null;
  if (!image || !databasePlace) return [];

  const current = existingByPlace.get(databasePlace.id);
  if (current && current.kind !== "service") return [];

  return [{
    place_id: databasePlace.id,
    attribute_type: "hero_image",
    value_json: {
      url: image.src,
      sourceUrl: `https://map.naver.com/p/entry/place/${candidate.id}`,
      altKo: `${sourcePlace.nameKo} 실제 매장 사진`,
      altEn: `Store photo for ${sourcePlace.nameKo}`,
      kind: "naver_store",
      naverPlaceId: candidate.id,
    },
    evidence_text: "네이버 플레이스 업주 등록 사진",
    verification_status: "official_source",
    confidence: 0.95,
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

console.log(JSON.stringify({
  researched: candidates.length,
  withNaverPhotos: candidates.filter((item) => item.images?.length).length,
  imported: rows.length,
  preservedExistingOfficial: existing.filter((item) => item.value_json?.kind !== "service").length,
}, null, 2));
