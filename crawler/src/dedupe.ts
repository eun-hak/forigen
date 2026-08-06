import type { PlaceSeed } from "./domain.js";
import { normalizeAddress, normalizeBusinessName, normalizePhone } from "./normalize.js";

export function similarity(left: string, right: string): number {
  if (left === right) return 1;
  if (!left || !right) return 0;
  const a = new Set([...left]);
  const b = new Set([...right]);
  const intersection = [...a].filter((char) => b.has(char)).length;
  return (2 * intersection) / (a.size + b.size);
}

export function matchScore(left: PlaceSeed, right: PlaceSeed): number {
  const name = similarity(normalizeBusinessName(left.nameKo), normalizeBusinessName(right.nameKo));
  const leftAddress = normalizeAddress(left.roadAddressKo ?? left.addressKo) ?? "";
  const rightAddress = normalizeAddress(right.roadAddressKo ?? right.addressKo) ?? "";
  const address = similarity(leftAddress, rightAddress);
  const leftPhone = normalizePhone(left.phone);
  const rightPhone = normalizePhone(right.phone);
  const phone = leftPhone && rightPhone && leftPhone === rightPhone ? 1 : 0;
  return Math.round((name * 40 + address * 45 + phone * 15) * 100) / 100;
}

export function dedupePlaces(places: readonly PlaceSeed[], threshold = 82): PlaceSeed[] {
  const unique: PlaceSeed[] = [];
  for (const place of places) {
    const duplicate = unique.find((candidate) => candidate.area === place.area && matchScore(candidate, place) >= threshold);
    if (!duplicate) {
      unique.push(place);
      continue;
    }
    duplicate.phone ??= place.phone;
    duplicate.roadAddressKo ??= place.roadAddressKo;
    duplicate.addressKo ??= place.addressKo;
    duplicate.sources.push(...place.sources.filter((source) =>
      !duplicate.sources.some((existing) => existing.sourceType === source.sourceType && existing.externalId === source.externalId),
    ));
  }
  return unique;
}
