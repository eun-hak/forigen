import { describe, expect, it } from "vitest";
import { kakaoMapLink, kakaoStaticMapUrl, mapQuerySchema } from "./map";

describe("Kakao map helpers", () => {
  it("accepts Korean coordinates and rejects out-of-range input", () => {
    expect(mapQuerySchema.parse({ lat: "37.5", lng: "127.0" })).toMatchObject({ lat: 37.5, lng: 127, width: 900, height: 420 });
    expect(() => mapQuerySchema.parse({ lat: "0", lng: "0" })).toThrow();
  });

  it("builds static image and external map URLs", () => {
    expect(kakaoStaticMapUrl(mapQuerySchema.parse({ lat: 37.5, lng: 127 }))).toContain("markers=location%3A127%2C37.5");
    expect(kakaoMapLink("테스트 샵", 37.5, 127)).toContain(encodeURIComponent("테스트 샵"));
  });
});
