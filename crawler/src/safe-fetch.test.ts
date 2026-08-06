import { describe, expect, it } from "vitest";
import { assertPublicUrl } from "./safe-fetch.js";

describe("assertPublicUrl", () => {
  it("blocks local and credential-bearing URLs", async () => {
    await expect(assertPublicUrl("http://127.0.0.1/test")).rejects.toThrow();
    await expect(assertPublicUrl("http://user:pass@example.com/test")).rejects.toThrow();
  });
});
