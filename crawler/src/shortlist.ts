import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { PlaceSeed } from "./domain.js";

export interface RankedPlace { place: PlaceSeed; score: number; reasons: string[] }

export function rankPlace(place: PlaceSeed): RankedPlace {
  let score = 0;
  const reasons: string[] = [];
  if (place.kakaoMatch) { score += Math.round(place.kakaoMatch.score * 0.35); reasons.push(`kakao:${place.kakaoMatch.score}`); }
  if (place.naverMatch) { score += Math.round(place.naverMatch.score * 0.12); reasons.push(`naver:${place.naverMatch.score}`); }
  if (place.phone) { score += 8; reasons.push("phone"); }
  if (place.roadAddressKo) { score += 5; reasons.push("road_address"); }
  score += Math.round((place.categoryConfidence ?? 0) * 18);
  if (/영어|english|외국|global|international|foreigner/i.test(place.nameKo)) { score += 15; reasons.push("international_signal"); }
  if (/퍼스널\s*컬러|헤드\s*스파|두피|head\s*spa|personal\s*colou?r/i.test(place.nameKo)) { score += 12; reasons.push("target_service_name"); }
  if (place.officialWebsite) { score += 12; reasons.push("official_website"); }
  if (place.bookingUrl) { score += 8; reasons.push("booking_url"); }
  return { place, score: Math.min(100, score), reasons };
}

function csv(value: string | number | undefined): string {
  const text = value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function buildBalancedShortlist(places: readonly PlaceSeed[], limit = 300): RankedPlace[] {
  const ranked = places.map(rankPlace).sort((a, b) => b.score - a.score || a.place.nameKo.localeCompare(b.place.nameKo));
  const areas = ["hongdae", "myeongdong", "gangnam", "seongsu"] as const;
  const categories = ["hair", "nails", "head_spa", "personal_color"] as const;
  const selected: RankedPlace[] = [];
  const selectedKeys = new Set<string>();
  const perCell = Math.max(3, Math.floor(limit / (areas.length * categories.length)));
  for (const area of areas) for (const category of categories) {
    for (const item of ranked.filter(({ place }) => place.area === area && place.primaryCategory === category).slice(0, perCell)) {
      selected.push(item); selectedKeys.add(item.place.externalKey);
    }
  }
  for (const item of ranked) {
    if (selected.length >= limit) break;
    if (!selectedKeys.has(item.place.externalKey)) { selected.push(item); selectedKeys.add(item.place.externalKey); }
  }
  return selected.sort((a, b) => b.score - a.score);
}

export async function writeShortlistCsv(path: string, items: readonly RankedPlace[]): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const header = ["external_key", "name_ko", "area", "category", "score", "kakao_match_score", "naver_match_score", "phone", "address", "kakao_url", "naver_title", "naver_link", "official_website", "reasons"];
  const rows = items.map(({ place, score, reasons }) => [
    place.externalKey, place.nameKo, place.area, place.primaryCategory, score, place.kakaoMatch?.score, place.naverMatch?.score,
    place.phone, place.roadAddressKo ?? place.addressKo, place.kakaoMatch?.url, place.naverMatch?.title, place.naverMatch?.link,
    place.officialWebsite, reasons.join("|"),
  ].map(csv).join(","));
  await writeFile(path, `${header.join(",")}\n${rows.join("\n")}\n`, "utf8");
}
