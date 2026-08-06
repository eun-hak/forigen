export function cleanText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const cleaned = value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  return cleaned.length > 0 ? cleaned : undefined;
}

export function normalizeBusinessName(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/주식회사|유한회사|㈜|\(주\)|본점|직영점/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

export function normalizePhone(value: string | undefined): string | undefined {
  const digits = value?.replace(/\D/g, "");
  return digits && digits.length >= 8 ? digits : undefined;
}

export function normalizeAddress(value: string | undefined): string | undefined {
  return cleanText(value)?.replace(/\s+/g, " ").replace(/특별시/g, "시");
}

export function firstValue(record: Record<string, unknown>, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const direct = cleanText(record[key]);
    if (direct) return direct;
    const found = Object.entries(record).find(([candidate]) => candidate.trim().toLowerCase() === key.toLowerCase());
    const value = found ? cleanText(found[1]) : undefined;
    if (value) return value;
  }
  return undefined;
}
