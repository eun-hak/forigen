import { describe, expect, it } from "vitest";
import { isIndependentWebsite, promoteIndependentWebsites } from "./channels.js";
import type { PlaceSeed } from "./domain.js";

describe("channel classification", () => {
  it("separates social and booking channels from independent sites", () => {
    expect(isIndependentWebsite("https://instagram.com/example")).toBe(false);
    expect(isIndependentWebsite("https://example-salon.com/book")).toBe(true);
  });
  it("promotes only independent websites", () => {
    const source = { sourceType: "public_data" as const, checkedAt: "2026-08-06T00:00:00.000Z" };
    const places: PlaceSeed[] = [
      { externalKey: "a", nameKo: "A", sources: [source], naverMatch: { title: "A", link: "https://a-salon.com", score: 80 } },
      { externalKey: "b", nameKo: "B", sources: [source], naverMatch: { title: "B", link: "https://instagram.com/b", score: 80 } },
    ];
    expect(promoteIndependentWebsites(places).filter((place) => place.officialWebsite)).toHaveLength(1);
  });
});
