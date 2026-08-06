# K-Beauty Now data pipeline

This package builds reviewable `crawl_candidates`; it never publishes extracted claims directly.

## Setup

```bash
corepack enable
pnpm install
cp .env.example .env
```

Replace the contact address in `CRAWLER_USER_AGENT` before crawling public websites.

## Pipeline

1. Download the official LOCALDATA beauty-salon CSV manually, or configure `PUBLIC_DATA_SERVICE_KEY`.
2. Import active businesses in Hongdae, Myeongdong, Gangnam, and Seongsu.
3. Optionally enrich coordinates and phone data using Kakao Local API.
4. Add official website URLs using the override CSV.
5. Collect official pages and create evidence-bearing candidates.
6. Review candidates before uploading or approving them.

LOCALDATA CSV files are commonly encoded as CP949. The importer detects UTF-8 versus CP949 automatically; do not resave the source file manually.

```bash
pnpm crawl import-csv --input crawler/input/beauty_salons.csv
pnpm crawl enrich-kakao --input crawler/output/places.json
pnpm crawl apply-websites \
  --input crawler/output/places-enriched.json \
  --websites crawler/input/websites.csv
pnpm crawl collect --input crawler/output/places-with-websites.json
pnpm crawl upload --input crawler/output/candidates.json
```

Or run the local stages together:

```bash
pnpm crawl pipeline \
  --input crawler/input/beauty_salons.csv \
  --websites crawler/input/websites.csv \
  --kakao
```

## Required external configuration

| Stage | Variables | Where to obtain it |
|---|---|---|
| Public-data API | `PUBLIC_DATA_SERVICE_KEY` | data.go.kr API application for `행정안전부_생활_미용업 조회서비스` |
| Kakao enrichment | `KAKAO_REST_API_KEY` | Kakao Developers application REST API key |
| Naver cross-check | `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` | Naver Developers application with Search API enabled |
| Candidate upload | `SUPABASE_URL`, `SUPABASE_SECRET_KEY` | Supabase Settings → API Keys → Publishable and secret API keys; server/local environment only |

Prefer a new `sb_secret_...` key. `SUPABASE_SERVICE_ROLE_KEY` remains a legacy fallback only. Neither key may be placed in `NEXT_PUBLIC_*` variables or browser code.

## Website override format

`external_key` is preferred. `name_ko` is a fallback and must match after normalization.

```csv
external_key,name_ko,official_website,booking_url
localdata:123456,업체명,https://official.example/en,https://official.example/book
```

## Safety and confidence rules

- Only HTTP(S) public hosts are fetched; localhost, private IPs, credentials in URLs, excessive redirects, and pages over 5 MB are blocked.
- Page failures are isolated and included in the CLI error summary.
- Extracted claims include exact evidence text, URL, timestamp, and confidence.
- English, card, same-day, and walk-in matches are candidates for human review, not automatic publication.
- Real-time availability is not collected or inferred.
