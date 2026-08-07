create table if not exists change_reports (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places(id) on delete cascade,
  reporter_email text,
  report_type text not null check (report_type in ('closed', 'contact', 'location', 'price', 'booking', 'other')),
  message text not null check (char_length(message) between 10 and 2000),
  source_url text,
  locale text not null default 'en' check (locale in ('en', 'ko')),
  status text not null default 'pending' check (status in ('pending', 'resolved', 'rejected')),
  resolution_note text,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_change_reports_status_created_at
  on change_reports(status, created_at desc);
create index if not exists idx_change_reports_place_id on change_reports(place_id);

alter table change_reports enable row level security;
revoke all on change_reports from anon, authenticated;
grant select, insert, update, delete on change_reports to service_role;
