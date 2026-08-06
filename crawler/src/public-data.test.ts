import { describe, expect, it } from "vitest";
import { detectBufferEncoding, mapPublicDataRow } from "./public-data.js";

describe("mapPublicDataRow", () => {
  it("detects UTF-8 and CP949 byte sequences", () => {
    expect(detectBufferEncoding(Buffer.from("사업장명", "utf8"))).toBe("utf8");
    expect(detectBufferEncoding(Uint8Array.from([0xbb, 0xe7, 0xbe, 0xf7, 0xc0, 0xe5]))).toBe("cp949");
  });
  it("maps an operating target-area salon", () => {
    const result = mapPublicDataRow({
      관리번호: "M123",
      사업장명: "테스트 헤어",
      도로명전체주소: "서울특별시 마포구 연남로 10",
      영업상태명: "영업/정상",
      업태구분명: "일반미용업",
    }, new Date("2026-08-06T00:00:00.000Z"));
    expect(result).toMatchObject({ externalKey: "localdata:M123", area: "hongdae", nameKo: "테스트 헤어" });
  });
  it("rejects closed and out-of-area records", () => {
    expect(mapPublicDataRow({ 사업장명: "폐업", 도로명전체주소: "서울 마포구 연남동", 영업상태명: "폐업" })).toBeUndefined();
    expect(mapPublicDataRow({ 사업장명: "영업", 도로명전체주소: "서울 노원구", 영업상태명: "영업/정상" })).toBeUndefined();
  });
});
