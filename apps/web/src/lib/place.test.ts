import { describe, expect, it } from "vitest";
import { attributeMap, hasVerificationFilters, placeListQuerySchema, recommendedScore, unwrapAttributeValue, withoutVerificationFilters } from "./place";

describe("public place helpers", () => {
  it("validates and coerces list query parameters", () => {
    expect(placeListQuerySchema.parse({ area: "hongdae", page: "2", limit: "10" })).toMatchObject({ area: "hongdae", page: 2, limit: 10, sort: "recommended" });
    expect(() => placeListQuerySchema.parse({ area: "seoul", limit: "101" })).toThrow();
  });

  it("unwraps stored attribute values", () => {
    expect(unwrapAttributeValue({ value: false })).toBe(false);
    expect(unwrapAttributeValue("confirmed")).toBe("confirmed");
  });

  it("maps attributes and calculates a recommendation score", () => {
    const attributes = [{ type: "same_day_booking", value: true, verificationStatus: "official_source", confidence: 0.9, evidenceText: null, verifiedAt: new Date().toISOString(), expiresAt: null }];
    expect(attributeMap(attributes)).toEqual({ same_day_booking: true });
    expect(recommendedScore(attributes, [{ code: "hair", name: "Hair", minPrice: 10000, maxPrice: null, durationMin: null, durationMax: null, priceNote: null, verifiedAt: null }])).toBe(60);
  });

  it("removes verification filters for honest fallback results", () => {
    const query = placeListQuerySchema.parse({ area: "gangnam", category: "head_spa", no_korean_phone: "true" });
    expect(hasVerificationFilters(query)).toBe(true);
    expect(withoutVerificationFilters(query)).toMatchObject({ area: "gangnam", category: "head_spa" });
    expect(withoutVerificationFilters(query)).not.toHaveProperty("no_korean_phone");
  });
});
