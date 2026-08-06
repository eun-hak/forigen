# 데이터베이스 설계

## 1. 개요

Supabase PostgreSQL을 사용합니다.

핵심 원칙:

- 장소 정보와 검증 속성을 분리
- 속성마다 출처·근거·확인 날짜 저장
- AI 추출 결과는 `crawl_candidates`에 먼저 저장
- 공개 데이터만 사용자 API에 노출

## 2. 주요 테이블

### places

```sql
create table places (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_ko text not null,
  name_en text,
  primary_category text not null,
  area text not null,
  district text,
  address_ko text,
  address_en text,
  latitude numeric,
  longitude numeric,
  phone text,
  official_website text,
  instagram_url text,
  booking_url text,
  status text not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

`status`:

```text
draft / published / hidden / closed
```

### services

```sql
create table services (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_en text not null
);
```

초기 코드:

```text
haircut
hair_color
nail_art
head_spa
personal_color
```

### place_services

```sql
create table place_services (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places(id) on delete cascade,
  service_id uuid not null references services(id),
  min_price integer,
  max_price integer,
  duration_min integer,
  duration_max integer,
  price_note text,
  verified_at timestamptz,
  unique(place_id, service_id)
);
```

### place_attributes

```sql
create table place_attributes (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places(id) on delete cascade,
  attribute_type text not null,
  value_json jsonb not null,
  verification_status text not null,
  confidence numeric,
  source_id uuid,
  evidence_text text,
  verified_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(place_id, attribute_type)
);
```

초기 `attribute_type`:

```text
english_support
korean_phone_required
international_phone_supported
foreign_card
same_day_booking
walk_in
solo_friendly
price_confirmed
```

### sources

```sql
create table sources (
  id uuid primary key default gen_random_uuid(),
  place_id uuid references places(id) on delete cascade,
  source_type text not null,
  source_url text,
  title text,
  captured_text text,
  screenshot_path text,
  content_hash text,
  checked_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
```

`source_type`:

```text
official_website
official_instagram
booking_page
business_response
visitor_report
public_data
auto_extracted
```

### crawl_candidates

```sql
create table crawl_candidates (
  id uuid primary key default gen_random_uuid(),
  external_key text,
  place_name text not null,
  source_url text,
  raw_data jsonb,
  extracted_data jsonb not null,
  evidence_text text,
  confidence numeric,
  status text not null default 'pending',
  review_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);
```

`status`:

```text
pending / approved / rejected / needs_revision
```

### change_reports

```sql
create table change_reports (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places(id),
  report_type text not null,
  message text not null,
  reporter_email text,
  evidence_url text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
```

### guides

```sql
create table guides (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  content_md text not null,
  status text not null default 'draft',
  published_at timestamptz,
  updated_at timestamptz not null default now()
);
```

## 3. 인덱스

```sql
create index idx_places_status_area_category
on places(status, area, primary_category);

create index idx_place_attributes_filter
on place_attributes(attribute_type, verification_status);

create index idx_candidates_status
on crawl_candidates(status, created_at);

create index idx_reports_status
on change_reports(status, created_at);
```

## 4. 다국어 확장

영어 이후에는 번역 테이블을 추가합니다.

```sql
create table place_translations (
  place_id uuid not null references places(id) on delete cascade,
  locale text not null,
  display_name text,
  summary text,
  booking_note text,
  caution_note text,
  primary key(place_id, locale)
);
```

구조화 속성은 언어와 무관하게 공통으로 사용합니다.
