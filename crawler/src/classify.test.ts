import { describe, expect, it } from "vitest";
import { classifyCategory, classifyPlaces } from "./classify.js";
import type { PlaceSeed } from "./domain.js";

const source = { sourceType: "public_data" as const, checkedAt: "2026-08-06T00:00:00.000Z" };
function place(nameKo: string, addressKo: string, categoryRaw: string): PlaceSeed {
  return { externalKey: nameKo, nameKo, addressKo, categoryRaw, sources: [source] };
}

describe("classification", () => {
  it("maps supported categories and name-specific services", () => {
    expect(classifyCategory("일반미용업", "테스트 헤드스파")).toMatchObject({ primaryCategory: "head_spa" });
    expect(classifyCategory("메이크업업", "퍼스널컬러 랩")).toMatchObject({ primaryCategory: "personal_color" });
    expect(classifyCategory("피부미용업", "피부관리")).toBeUndefined();
  });
  it("uses strict neighborhoods instead of broad road aliases", () => {
    const result = classifyPlaces([
      place("포함", "서울 마포구 연남동 1", "일반미용업"),
      place("제외", "서울 중구 신당동 퇴계로 393", "네일아트업"),
      place("성수", "서울 성동구 성수동2가 1", "네일아트업"),
    ]);
    expect(result.included.map((item) => item.nameKo)).toEqual(["포함", "성수"]);
  });
});
