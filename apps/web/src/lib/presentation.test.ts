import { describe, expect, it } from "vitest";
import { attributeLabel, humanValue, verificationPresentation } from "./presentation";

describe("public presentation", () => {
  it("maps verification states to honest user copy", () => {
    expect(verificationPresentation("official_source").tone).toBe("verified");
    expect(verificationPresentation("likely").label).toContain("confirm");
  });

  it("formats attribute names and negative phone requirements", () => {
    expect(attributeLabel("foreign_card")).toBe("Foreign-issued cards");
    expect(humanValue("korean_phone_required", false)).toBe("Not required");
  });
});
