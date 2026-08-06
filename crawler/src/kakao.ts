import type { Config } from "./config.js";
import type { PlaceSeed } from "./domain.js";
import { matchScore } from "./dedupe.js";

interface KakaoDocument {
  id: string;
  place_name: string;
  category_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  place_url: string;
}

interface KakaoResponse { documents: KakaoDocument[] }

const AREA_QUERY_LABEL: Record<NonNullable<PlaceSeed["area"]>, string> = {
  hongdae: "홍대",
  myeongdong: "명동",
  gangnam: "강남",
  seongsu: "성수",
};

function kakaoAsSeed(document: KakaoDocument, checkedAt: string): PlaceSeed {
  return {
    externalKey: `kakao:${document.id}`,
    nameKo: document.place_name,
    addressKo: document.address_name || undefined,
    roadAddressKo: document.road_address_name || undefined,
    phone: document.phone || undefined,
    categoryRaw: document.category_name || undefined,
    latitude: Number(document.y),
    longitude: Number(document.x),
    sources: [{ sourceType: "kakao_local", sourceUrl: document.place_url, externalId: document.id, checkedAt }],
  };
}

export async function enrichWithKakao(place: PlaceSeed, config: Config): Promise<PlaceSeed> {
  if (!config.KAKAO_REST_API_KEY) return place;
  const areaLabel = place.area ? AREA_QUERY_LABEL[place.area] : "서울";
  const queries = [`${place.nameKo} ${areaLabel}`, place.nameKo];
  let documents: KakaoDocument[] = [];
  for (const query of queries) {
    const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
    url.searchParams.set("query", query);
    url.searchParams.set("size", "5");
    const response = await fetch(url, { headers: { Authorization: `KakaoAK ${config.KAKAO_REST_API_KEY}` } });
    if (!response.ok) throw new Error(`Kakao request failed: ${response.status} ${response.statusText}`);
    const data = await response.json() as KakaoResponse;
    documents = data.documents;
    if (documents.length > 0) break;
  }
  const checkedAt = new Date().toISOString();
  const matches = documents.map((document) => ({ document, seed: kakaoAsSeed(document, checkedAt) }));
  const best = matches.map((item) => ({ ...item, score: matchScore(place, item.seed) })).sort((a, b) => b.score - a.score)[0];
  if (!best || best.score < 65) return place;
  return {
    ...place,
    phone: place.phone ?? best.seed.phone,
    latitude: best.seed.latitude,
    longitude: best.seed.longitude,
    kakaoMatch: {
      id: best.document.id,
      url: best.document.place_url,
      score: best.score,
      name: best.document.place_name,
      ...((best.document.road_address_name || best.document.address_name) ? { address: best.document.road_address_name || best.document.address_name } : {}),
      ...(best.document.phone ? { phone: best.document.phone } : {}),
      ...(best.document.category_name ? { category: best.document.category_name } : {}),
    },
    sources: [...place.sources, ...best.seed.sources],
  };
}
