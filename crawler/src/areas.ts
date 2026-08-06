import type { TargetArea } from "./domain.js";

const areaTokens: Record<TargetArea, readonly string[]> = {
  hongdae: ["홍대", "서교동", "동교동", "연남동", "연남로", "합정동", "망원동", "상수동", "양화로", "홍익로", "와우산로", "잔다리로"],
  myeongdong: ["명동", "충무로", "을지로", "남산동", "회현동", "퇴계로", "소공로"],
  gangnam: ["강남", "역삼동", "논현동", "신사동", "청담동", "삼성동", "대치동", "강남대로", "테헤란로", "도산대로", "압구정로"],
  seongsu: ["성수", "성수동", "서울숲", "송정동", "아차산로", "연무장길", "왕십리로"],
};

const targetNeighborhoods: Record<TargetArea, readonly RegExp[]> = {
  hongdae: [/서교동/, /동교동/, /연남동/, /합정동/, /상수동/, /망원동/],
  myeongdong: [/명동[12]가/, /충무로[12]가/, /남산동[123]가/, /회현동[123]가/, /소공동/, /남창동/, /을지로[12]가/, /저동[12]가/],
  gangnam: [/역삼동/, /논현동/, /신사동/, /청담동/, /삼성동/, /대치동/, /압구정동/, /서초동/],
  seongsu: [/성수동[12]가/, /송정동/],
};

export function detectTargetArea(...values: Array<string | undefined>): TargetArea | undefined {
  const text = values.filter(Boolean).join(" ").replaceAll(" ", "").toLowerCase();
  for (const [area, tokens] of Object.entries(areaTokens) as Array<[TargetArea, readonly string[]]>) {
    if (tokens.some((token) => text.includes(token.replaceAll(" ", "").toLowerCase()))) return area;
  }
  return undefined;
}

export function detectStrictTargetArea(...values: Array<string | undefined>): TargetArea | undefined {
  const text = values.filter(Boolean).join(" ");
  for (const [area, patterns] of Object.entries(targetNeighborhoods) as Array<[TargetArea, readonly RegExp[]]>) {
    if (patterns.some((pattern) => pattern.test(text))) return area;
  }
  return undefined;
}
