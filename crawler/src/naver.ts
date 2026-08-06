import type { Config } from "./config.js";
import type { PlaceSeed } from "./domain.js";
import { matchScore } from "./dedupe.js";
import { cleanText } from "./normalize.js";

interface NaverItem {
  title: string;
  link: string;
  category: string;
  address: string;
  roadAddress: string;
}
interface NaverResponse { items?: NaverItem[]; errorCode?: string; errorMessage?: string }

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function searchNaver(query: string, config: Config): Promise<NaverItem[]> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (attempt === 0) await delay(150);
    const url = new URL("https://openapi.naver.com/v1/search/local.json");
    url.searchParams.set("query", query);
    url.searchParams.set("display", "5");
    const response = await fetch(url, { headers: {
      "X-Naver-Client-Id": config.NAVER_CLIENT_ID as string,
      "X-Naver-Client-Secret": config.NAVER_CLIENT_SECRET as string,
    } });
    const body = await response.json() as NaverResponse;
    if (response.ok) return body.items ?? [];
    if (response.status === 429 && attempt < 3) {
      await delay(500 * (2 ** attempt));
      continue;
    }
    throw new Error(`Naver request failed: ${response.status} ${body.errorCode ?? ""} ${body.errorMessage ?? ""}`.trim());
  }
  return [];
}

const AREA_QUERY_LABEL: Record<NonNullable<PlaceSeed["area"]>, string> = {
  hongdae: "홍대",
  myeongdong: "명동",
  gangnam: "강남",
  seongsu: "성수",
};

function asSeed(item: NaverItem): PlaceSeed {
  return {
    externalKey: `naver:${cleanText(item.title) ?? item.title}`,
    nameKo: cleanText(item.title) ?? item.title,
    ...(item.address ? { addressKo: item.address } : {}),
    ...(item.roadAddress ? { roadAddressKo: item.roadAddress } : {}),
    ...(item.category ? { categoryRaw: cleanText(item.category) } : {}),
    sources: [{ sourceType: "public_data", checkedAt: new Date().toISOString() }],
  };
}

function safeLink(value: string): string | undefined {
  if (!value) return undefined;
  try { return new URL(value).toString(); } catch { return undefined; }
}

export async function enrichWithNaver(place: PlaceSeed, config: Config): Promise<PlaceSeed> {
  if (!config.NAVER_CLIENT_ID || !config.NAVER_CLIENT_SECRET) return place;
  const area = place.area ? AREA_QUERY_LABEL[place.area] : "서울";
  const queries = [`${place.nameKo} ${area}`, place.nameKo];
  let items: NaverItem[] = [];
  for (const query of queries) {
    items = await searchNaver(query, config);
    if (items.length > 0) break;
  }
  const best = items.map((item) => ({ item, score: matchScore(place, asSeed(item)) })).sort((a, b) => b.score - a.score)[0];
  if (!best || best.score < 65) return place;
  const link = safeLink(best.item.link);
  return {
    ...place,
    naverMatch: {
      title: cleanText(best.item.title) ?? best.item.title,
      score: best.score,
      ...(link ? { link } : {}),
      ...((best.item.roadAddress || best.item.address) ? { address: best.item.roadAddress || best.item.address } : {}),
      ...(best.item.category ? { category: cleanText(best.item.category) ?? best.item.category } : {}),
    },
    sources: [...place.sources, ...(link ? [{ sourceType: "naver_local" as const, sourceUrl: link, checkedAt: new Date().toISOString() }] : [])],
  };
}
