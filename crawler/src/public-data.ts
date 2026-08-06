import { createReadStream } from "node:fs";
import { open } from "node:fs/promises";
import { parse } from "csv-parse";
import iconv from "iconv-lite";
import type { Config } from "./config.js";
import { detectTargetArea } from "./areas.js";
import { placeSeedSchema, type PlaceSeed } from "./domain.js";
import { cleanText, firstValue } from "./normalize.js";

const FIELD_NAMES = {
  id: ["관리번호", "manageNo", "mgtno", "MGTNO"],
  name: ["사업장명", "업소명", "bplcNm", "BPLCNM"],
  address: ["소재지전체주소", "지번주소", "siteWhlAddr", "SITEWHLADDR"],
  roadAddress: ["도로명전체주소", "도로명주소", "rdnWhlAddr", "RDNWHLADDR"],
  phone: ["소재지전화", "전화번호", "siteTel", "SITETEL"],
  status: ["영업상태명", "상세영업상태명", "trdStateNm", "dtlStateNm", "TRDSTATENM"],
  category: ["업태구분명", "위생업태명", "uptaeNm", "UPTAENM"],
  licensedAt: ["인허가일자", "apvPermYmd", "APVPERMYMD"],
  closedAt: ["폐업일자", "dcbYmd", "DCBYMD"],
} as const;

function isOperating(status: string | undefined): boolean {
  if (!status) return true;
  return /영업|정상|open/i.test(status) && !/폐업|취소|말소|정지|휴업|closed/i.test(status);
}

export function mapPublicDataRow(record: Record<string, unknown>, checkedAt = new Date()): PlaceSeed | undefined {
  const nameKo = firstValue(record, FIELD_NAMES.name);
  if (!nameKo) return undefined;
  const businessStatus = firstValue(record, FIELD_NAMES.status);
  if (!isOperating(businessStatus)) return undefined;
  const addressKo = firstValue(record, FIELD_NAMES.address);
  const roadAddressKo = firstValue(record, FIELD_NAMES.roadAddress);
  const area = detectTargetArea(addressKo, roadAddressKo);
  if (!area) return undefined;
  const externalId = firstValue(record, FIELD_NAMES.id) ?? `${nameKo}:${roadAddressKo ?? addressKo ?? "unknown"}`;

  return placeSeedSchema.parse({
    externalKey: `localdata:${externalId}`,
    nameKo,
    addressKo,
    roadAddressKo,
    phone: firstValue(record, FIELD_NAMES.phone),
    categoryRaw: firstValue(record, FIELD_NAMES.category),
    businessStatus,
    licensedAt: firstValue(record, FIELD_NAMES.licensedAt),
    closedAt: firstValue(record, FIELD_NAMES.closedAt),
    area,
    sources: [{
      sourceType: "public_data",
      sourceUrl: "https://www.data.go.kr/data/15154918/openapi.do",
      externalId,
      checkedAt: checkedAt.toISOString(),
    }],
  });
}

export async function readPublicDataCsv(path: string): Promise<PlaceSeed[]> {
  const encoding = await detectCsvEncoding(path);
  const records = createReadStream(path).pipe(iconv.decodeStream(encoding)).pipe(parse({
    columns: (headers: string[]) => headers.map((header) => header.replace(/^\uFEFF/, "").trim()),
    bom: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  }));
  const places: PlaceSeed[] = [];
  for await (const raw of records) {
    const place = mapPublicDataRow(raw as Record<string, unknown>);
    if (place) places.push(place);
  }
  return places;
}

export function detectBufferEncoding(bytes: Uint8Array): "utf8" | "cp949" {
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return "utf8";
  } catch {
    return "cp949";
  }
}

export async function detectCsvEncoding(path: string): Promise<"utf8" | "cp949"> {
  const handle = await open(path, "r");
  try {
    const buffer = Buffer.alloc(8192);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    return detectBufferEncoding(buffer.subarray(0, bytesRead));
  } finally {
    await handle.close();
  }
}

function findItems(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) return value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null);
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  for (const key of ["items", "item", "row", "data"]) {
    const found = findItems(record[key]);
    if (found.length > 0) return found;
  }
  for (const nested of Object.values(record)) {
    const found = findItems(nested);
    if (found.length > 0) return found;
  }
  return [];
}

export async function fetchPublicData(config: Config, page = 1, rows = 1000): Promise<PlaceSeed[]> {
  if (!config.PUBLIC_DATA_SERVICE_KEY) throw new Error("PUBLIC_DATA_SERVICE_KEY is required for API import");
  const url = new URL("info", `${config.PUBLIC_DATA_BASE_URL.replace(/\/$/, "")}/`);
  url.searchParams.set("serviceKey", config.PUBLIC_DATA_SERVICE_KEY);
  url.searchParams.set("pageNo", String(page));
  url.searchParams.set("numOfRows", String(rows));
  url.searchParams.set("type", "json");
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Public data request failed: ${response.status} ${response.statusText}`);
  const body: unknown = await response.json();
  return findItems(body).map((row) => mapPublicDataRow(row)).filter((place): place is PlaceSeed => Boolean(place));
}
