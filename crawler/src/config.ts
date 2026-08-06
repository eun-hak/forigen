import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadDotenv } from "dotenv";
import { z } from "zod";

const envCandidates = [
  resolve(process.env.INIT_CWD ?? process.cwd(), ".env"),
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "../.env"),
];
const envPath = envCandidates.find((candidate) => existsSync(candidate));
if (envPath) loadDotenv({ path: envPath, quiet: true });

const optionalUrl = z.preprocess((value) => value === "" ? undefined : value, z.url().optional());
const optionalString = z.preprocess((value) => value === "" ? undefined : value, z.string().min(1).optional());

const envSchema = z.object({
  PUBLIC_DATA_SERVICE_KEY: optionalString,
  PUBLIC_DATA_BASE_URL: z.url().default("https://apis.data.go.kr/1741000/beauty_salons"),
  KAKAO_REST_API_KEY: optionalString,
  NAVER_CLIENT_ID: optionalString,
  NAVER_CLIENT_SECRET: optionalString,
  SUPABASE_URL: optionalUrl,
  SUPABASE_SECRET_KEY: optionalString,
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  CRAWLER_OUTPUT_DIR: z.string().default("./crawler/output"),
  CRAWLER_USER_AGENT: z.string().default("KBeautyNowResearchBot/0.1 (+contact@example.com)"),
  CRAWLER_CONCURRENCY: z.coerce.number().int().min(1).max(5).default(2),
});

export type Config = z.infer<typeof envSchema>;
export const config: Config = envSchema.parse(process.env);
