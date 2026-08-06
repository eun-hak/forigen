import { describe, expect, it } from "vitest";
import { dedupePlaces, matchScore } from "./dedupe.js";
import type { PlaceSeed } from "./domain.js";

const source = { sourceType: "public_data" as const, checkedAt: "2026-08-06T00:00:00.000Z" };
const first: PlaceSeed = { externalKey: "a", nameKo: "준오헤어 (홍대점)", roadAddressKo: "서울 마포구 양화로 1", phone: "02-123-4567", area: "hongdae", sources: [source] };
const second: PlaceSeed = { externalKey: "b", nameKo: "준오헤어 홍대점", roadAddressKo: "서울 마포구 양화로 1", phone: "021234567", area: "hongdae", sources: [source] };

describe("dedupe", () => {
  it("scores and merges likely duplicates", () => {
    expect(matchScore(first, second)).toBeGreaterThan(82);
    expect(dedupePlaces([first, second])).toHaveLength(1);
  });
});
