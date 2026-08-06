import { describe, expect, it } from "vitest";
import { buildBalancedShortlist, rankPlace } from "./shortlist.js";
import type { PlaceSeed } from "./domain.js";

const source = { sourceType: "public_data" as const, checkedAt: "2026-08-06T00:00:00.000Z" };
const base: PlaceSeed = { externalKey: "a", nameKo: "테스트", area: "hongdae", primaryCategory: "hair", categoryConfidence: 0.9, sources: [source] };

describe("shortlist ranking", () => {
  it("prioritizes matched and contactable places", () => {
    const enriched: PlaceSeed = { ...base, externalKey: "b", phone: "021234567", kakaoMatch: { id: "1", url: "https://place.map.kakao.com/1", score: 90, name: "테스트" } };
    expect(rankPlace(enriched).score).toBeGreaterThan(rankPlace(base).score);
    expect(buildBalancedShortlist([base, enriched], 1)[0]?.place.externalKey).toBe("b");
  });
});
