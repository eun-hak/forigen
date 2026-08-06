import { describe, expect, it } from "vitest";
import { candidatePlaceView } from "./candidate";

describe("candidatePlaceView", () => {
  it("normalizes nested candidate data for the admin list", () => {
    expect(candidatePlaceView({ place: { area: "hongdae", primaryCategory: "hair", roadAddressKo: "서울 마포구", kakaoMatch: { score: 88 } } })).toEqual({
      area: "hongdae", category: "hair", address: "서울 마포구", kakaoScore: "88", naverScore: "-",
    });
  });
  it("provides safe fallbacks", () => expect(candidatePlaceView({})).toEqual({ area: "-", category: "-", address: "주소 없음", kakaoScore: "-", naverScore: "-" }));
});
