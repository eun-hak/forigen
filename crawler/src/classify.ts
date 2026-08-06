import { detectStrictTargetArea } from "./areas.js";
import type { PlaceSeed } from "./domain.js";

export interface ClassificationResult {
  included: PlaceSeed[];
  excluded: Array<{ place: PlaceSeed; reason: "outside_target_area" | "unsupported_category" }>;
}

export function classifyCategory(raw: string | undefined, name = ""): Pick<PlaceSeed, "primaryCategory" | "categoryConfidence"> | undefined {
  if (!raw) return undefined;
  if (/퍼스널\s*컬러|personal\s*colou?r/i.test(name)) return { primaryCategory: "personal_color", categoryConfidence: 0.92 };
  if (/헤드\s*스파|두피|head\s*spa|scalp/i.test(name)) return { primaryCategory: "head_spa", categoryConfidence: 0.72 };
  if (/네일/i.test(raw)) return { primaryCategory: "nails", categoryConfidence: 0.98 };
  if (/메이크업/i.test(raw)) return { primaryCategory: "personal_color", categoryConfidence: 0.45 };
  if (/일반미용/i.test(raw)) return { primaryCategory: "hair", categoryConfidence: 0.9 };
  return undefined;
}

export function classifyPlaces(places: readonly PlaceSeed[]): ClassificationResult {
  const included: PlaceSeed[] = [];
  const excluded: ClassificationResult["excluded"] = [];
  for (const place of places) {
    const area = detectStrictTargetArea(place.addressKo, place.roadAddressKo);
    if (!area) {
      excluded.push({ place, reason: "outside_target_area" });
      continue;
    }
    const category = classifyCategory(place.categoryRaw, place.nameKo);
    if (!category) {
      excluded.push({ place, reason: "unsupported_category" });
      continue;
    }
    included.push({ ...place, area, ...category });
  }
  return { included, excluded };
}
