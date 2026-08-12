import { describe, expect, it, vi } from "vitest";
import { changeReportSchema } from "./change-report";

const validReport = {
  locale: "en",
  placeId: "123e4567-e89b-42d3-a456-426614174000",
  slug: "hair-123abc",
  reportType: "contact",
  message: "The phone number has changed.",
  reporterEmail: "",
  sourceUrl: "https://example.com/contact",
  website: "",
  renderedAt: 1_000,
};

describe("change report validation", () => {
  it("accepts a human-paced report", () => {
    vi.spyOn(Date, "now").mockReturnValue(3_000);
    expect(changeReportSchema.parse(validReport)).toMatchObject(validReport);
    vi.restoreAllMocks();
  });

  it("rejects honeypot submissions and unsupported URL protocols", () => {
    vi.spyOn(Date, "now").mockReturnValue(3_000);
    expect(() => changeReportSchema.parse({ ...validReport, website: "spam" })).toThrow();
    expect(() => changeReportSchema.parse({ ...validReport, sourceUrl: "javascript:alert(1)" })).toThrow();
    vi.restoreAllMocks();
  });

  it("rejects submissions that are implausibly fast", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_500);
    expect(() => changeReportSchema.parse(validReport)).toThrow("Invalid submission timing");
    vi.restoreAllMocks();
  });
});

