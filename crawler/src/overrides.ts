import { createReadStream } from "node:fs";
import { parse } from "csv-parse";
import { normalizeBusinessName } from "./normalize.js";
import type { PlaceSeed } from "./domain.js";

interface OverrideRow {
  external_key?: string;
  name_ko?: string;
  official_website?: string;
  booking_url?: string;
}

export async function applyWebsiteOverrides(places: readonly PlaceSeed[], csvPath: string): Promise<PlaceSeed[]> {
  const byKey = new Map<string, OverrideRow>();
  const byName = new Map<string, OverrideRow>();
  const rows = createReadStream(csvPath).pipe(parse({ columns: true, bom: true, skip_empty_lines: true, trim: true }));
  for await (const raw of rows) {
    const row = raw as OverrideRow;
    if (row.external_key) byKey.set(row.external_key, row);
    if (row.name_ko) byName.set(normalizeBusinessName(row.name_ko), row);
  }
  return places.map((place) => {
    const override = byKey.get(place.externalKey) ?? byName.get(normalizeBusinessName(place.nameKo));
    if (!override) return place;
    return {
      ...place,
      ...(override.official_website ? { officialWebsite: new URL(override.official_website).toString() } : {}),
      ...(override.booking_url ? { bookingUrl: new URL(override.booking_url).toString() } : {}),
    };
  });
}
