import { describe, expect, it } from "vitest";
import { detectTargetArea } from "./areas.js";

describe("detectTargetArea", () => {
  it("maps target neighborhoods", () => {
    expect(detectTargetArea("서울 마포구 연남동 123")).toBe("hongdae");
    expect(detectTargetArea("서울 중구 명동길 1")).toBe("myeongdong");
    expect(detectTargetArea("서울 강남구 역삼동 1")).toBe("gangnam");
    expect(detectTargetArea("서울 성동구 성수동2가 1")).toBe("seongsu");
  });
  it("does not include non-target areas", () => expect(detectTargetArea("서울 노원구 공릉동")).toBeUndefined());
});
