import { describe, expect, it } from "vitest";
import { placeStatusUpdate } from "./admin-place";

describe("place status update", () => {
  const now = "2026-08-06T00:00:00.000Z";

  it("sets the publication timestamp when publishing", () => {
    expect(placeStatusUpdate("published", now)).toEqual({ status: "published", published_at: now, updated_at: now });
  });

  it("clears the publication timestamp when unpublishing", () => {
    expect(placeStatusUpdate("hidden", now)).toEqual({ status: "hidden", published_at: null, updated_at: now });
  });
});
