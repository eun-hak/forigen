create table if not exists places (
  id uuid primary key default gen_random_uuid(),
  external_key text unique,
  slug text not null unique,
  name_ko text not null,
  name_en text,
  primary_category text not null check (primary_category in ('hair', 'nails', 'head_spa', 'personal_color')),
  area text not null check (area in ('hongdae', 'myeongdong', 'gangnam', 'seongsu')),
  address_ko text,
  latitude numeric,
  longitude numeric,
  phone text,
  official_website text,
  booking_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'hidden', 'closed')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_en text not null
);

insert into services(code, name_en) values
  ('hair', 'Hair'), ('nails', 'Nails'), ('head_spa', 'Head Spa'), ('personal_color', 'Personal Color')
on conflict (code) do update set name_en = excluded.name_en;

create table if not exists place_services (
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

create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places(id) on delete cascade,
  source_type text not null,
  source_url text,
  title text,
  captured_text text,
  screenshot_path text,
  checked_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists place_attributes (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places(id) on delete cascade,
  attribute_type text not null,
  value_json jsonb not null,
  verification_status text not null,
  confidence numeric check (confidence between 0 and 1),
  source_id uuid references sources(id) on delete set null,
  evidence_text text,
  verified_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(place_id, attribute_type)
);

create table if not exists admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_places_status_area_category on places(status, area, primary_category);
create index if not exists idx_attributes_type_status on place_attributes(attribute_type, verification_status);

alter table places enable row level security;
alter table services enable row level security;
alter table place_services enable row level security;
alter table sources enable row level security;
alter table place_attributes enable row level security;
alter table admin_audit_logs enable row level security;

revoke all on places, services, place_services, sources, place_attributes, admin_audit_logs from anon, authenticated;
grant select, insert, update, delete on places, services, place_services, sources, place_attributes, admin_audit_logs to service_role;

create or replace function approve_crawl_candidate(
  p_candidate_id uuid,
  p_extracted_data jsonb,
  p_reviewer uuid default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_candidate crawl_candidates%rowtype;
  v_place jsonb := p_extracted_data->'place';
  v_place_id uuid;
  v_source jsonb;
  v_evidence jsonb;
  v_source_id uuid;
  v_category text;
begin
  select * into v_candidate from crawl_candidates where id = p_candidate_id for update;
  if not found then raise exception 'Candidate not found'; end if;
  if v_candidate.status <> 'pending' and v_candidate.status <> 'needs_revision' then
    raise exception 'Candidate is not reviewable: %', v_candidate.status;
  end if;

  v_category := v_place->>'primaryCategory';
  insert into places(external_key, slug, name_ko, primary_category, area, address_ko, latitude, longitude, phone, official_website, booking_url, status)
  values(
    v_candidate.external_key,
    lower(v_category || '-' || substr(md5(v_candidate.external_key), 1, 12)),
    coalesce(v_place->>'nameKo', v_candidate.place_name),
    v_category,
    v_place->>'area',
    coalesce(v_place->>'roadAddressKo', v_place->>'addressKo'),
    nullif(v_place->>'latitude', '')::numeric,
    nullif(v_place->>'longitude', '')::numeric,
    v_place->>'phone', v_place->>'officialWebsite', v_place->>'bookingUrl', 'draft'
  )
  on conflict (external_key) do update set
    name_ko = excluded.name_ko, primary_category = excluded.primary_category, area = excluded.area,
    address_ko = excluded.address_ko, latitude = excluded.latitude, longitude = excluded.longitude,
    phone = excluded.phone, official_website = excluded.official_website, booking_url = excluded.booking_url,
    updated_at = now()
  returning id into v_place_id;

  insert into place_services(place_id, service_id)
  select v_place_id, id from services where code = v_category
  on conflict (place_id, service_id) do nothing;

  delete from sources where place_id = v_place_id;
  for v_source in select * from jsonb_array_elements(coalesce(v_place->'sources', '[]'::jsonb)) loop
    insert into sources(place_id, source_type, source_url, checked_at)
    values(v_place_id, v_source->>'sourceType', v_source->>'sourceUrl', coalesce((v_source->>'checkedAt')::timestamptz, now()));
  end loop;

  for v_evidence in select * from jsonb_array_elements(coalesce(p_extracted_data->'evidence', '[]'::jsonb)) loop
    select id into v_source_id from sources where place_id = v_place_id and source_url = v_evidence->>'sourceUrl' order by created_at desc limit 1;
    insert into place_attributes(place_id, attribute_type, value_json, verification_status, confidence, source_id, evidence_text, verified_at)
    values(v_place_id, v_evidence->>'attributeType', jsonb_build_object('value', v_evidence->'value'), v_evidence->>'status',
      nullif(v_evidence->>'confidence', '')::numeric, v_source_id, v_evidence->>'evidenceText', (v_evidence->>'checkedAt')::timestamptz)
    on conflict (place_id, attribute_type) do update set
      value_json = excluded.value_json, verification_status = excluded.verification_status, confidence = excluded.confidence,
      source_id = excluded.source_id, evidence_text = excluded.evidence_text, verified_at = excluded.verified_at, updated_at = now();
  end loop;

  update crawl_candidates set status = 'approved', extracted_data = p_extracted_data, reviewed_at = now(), reviewed_by = p_reviewer where id = p_candidate_id;
  insert into admin_audit_logs(actor_id, action, entity_type, entity_id, after_data)
  values(p_reviewer, 'approve', 'crawl_candidate', p_candidate_id, p_extracted_data);
  return v_place_id;
end;
$$;

revoke all on function approve_crawl_candidate(uuid, jsonb, uuid) from public, anon, authenticated;
grant execute on function approve_crawl_candidate(uuid, jsonb, uuid) to service_role;
