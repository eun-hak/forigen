create extension if not exists pgcrypto;

create table if not exists crawl_candidates (
  id uuid primary key default gen_random_uuid(),
  external_key text not null unique,
  place_name text not null,
  source_url text,
  raw_data jsonb not null default '{}'::jsonb,
  extracted_data jsonb not null,
  evidence_text text,
  confidence numeric check (confidence between 0 and 1),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'needs_revision')),
  review_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);

create index if not exists idx_crawl_candidates_status_created_at
  on crawl_candidates(status, created_at);

alter table crawl_candidates enable row level security;

-- No public policy is intentionally created. Service-role requests bypass RLS.
revoke all on table crawl_candidates from anon, authenticated;
grant select, insert, update, delete on table crawl_candidates to service_role;
