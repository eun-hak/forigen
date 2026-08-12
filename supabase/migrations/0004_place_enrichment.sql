create table if not exists place_social_accounts (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places(id) on delete cascade,
  platform text not null check (platform in ('instagram', 'youtube', 'tiktok')),
  handle text,
  profile_url text not null,
  confidence numeric check (confidence between 0 and 1),
  verification_status text not null default 'candidate' check (verification_status in ('candidate', 'verified', 'rejected')),
  checked_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique(place_id, platform, profile_url)
);

create table if not exists place_booking_channels (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places(id) on delete cascade,
  channel_type text not null check (channel_type in ('website', 'instagram_dm', 'whatsapp', 'line', 'kakao', 'naver_booking', 'email', 'phone')),
  channel_url text,
  channel_value text,
  is_primary boolean not null default false,
  confidence numeric check (confidence between 0 and 1),
  verification_status text not null default 'candidate' check (verification_status in ('candidate', 'verified', 'rejected')),
  checked_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (channel_url is not null or channel_value is not null),
  unique(place_id, channel_type, channel_url)
);

create table if not exists place_menu_items (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places(id) on delete cascade,
  name text not null,
  price integer not null check (price >= 0),
  currency text not null default 'KRW',
  evidence_text text not null,
  source_url text not null,
  confidence numeric check (confidence between 0 and 1),
  verification_status text not null default 'candidate' check (verification_status in ('candidate', 'verified', 'rejected')),
  checked_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique(place_id, name, price)
);

create table if not exists place_opening_hours (
  place_id uuid primary key references places(id) on delete cascade,
  hours_text text not null,
  confidence numeric check (confidence between 0 and 1),
  verification_status text not null default 'candidate' check (verification_status in ('candidate', 'verified', 'rejected')),
  checked_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table place_social_accounts enable row level security;
alter table place_booking_channels enable row level security;
alter table place_menu_items enable row level security;
alter table place_opening_hours enable row level security;
revoke all on place_social_accounts, place_booking_channels, place_menu_items, place_opening_hours from anon, authenticated;
grant select, insert, update, delete on place_social_accounts, place_booking_channels, place_menu_items, place_opening_hours to service_role;

create or replace function sync_candidate_enrichment() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_place_id uuid;
  v_item jsonb;
  v_place jsonb := new.extracted_data->'place';
begin
  if new.status <> 'approved' or old.status = 'approved' then return new; end if;
  select id into v_place_id from places where external_key = new.external_key;
  if v_place_id is null then return new; end if;

  for v_item in select * from jsonb_array_elements(coalesce(v_place->'socialAccounts', '[]'::jsonb)) loop
    insert into place_social_accounts(place_id, platform, handle, profile_url, confidence, verification_status, checked_at)
    values(v_place_id, v_item->>'platform', v_item->>'handle', v_item->>'profileUrl', (v_item->>'confidence')::numeric, 'verified', (v_item->>'checkedAt')::timestamptz)
    on conflict (place_id, platform, profile_url) do update set handle=excluded.handle, confidence=excluded.confidence, checked_at=excluded.checked_at;
  end loop;

  for v_item in select * from jsonb_array_elements(coalesce(v_place->'bookingChannels', '[]'::jsonb)) loop
    insert into place_booking_channels(place_id, channel_type, channel_url, channel_value, confidence, verification_status, checked_at)
    values(v_place_id, v_item->>'channelType', v_item->>'url', v_item->>'value', (v_item->>'confidence')::numeric, 'verified', (v_item->>'checkedAt')::timestamptz)
    on conflict (place_id, channel_type, channel_url) do update set channel_value=excluded.channel_value, confidence=excluded.confidence, checked_at=excluded.checked_at;
  end loop;

  for v_item in select * from jsonb_array_elements(coalesce(v_place->'menuItems', '[]'::jsonb)) loop
    insert into place_menu_items(place_id, name, price, currency, evidence_text, source_url, confidence, verification_status, checked_at)
    values(v_place_id, v_item->>'name', (v_item->>'price')::integer, coalesce(v_item->>'currency', 'KRW'), v_item->>'evidenceText', v_item->>'sourceUrl', (v_item->>'confidence')::numeric, 'verified', (v_item->>'checkedAt')::timestamptz)
    on conflict (place_id, name, price) do update set evidence_text=excluded.evidence_text, source_url=excluded.source_url, confidence=excluded.confidence, checked_at=excluded.checked_at;
  end loop;

  if nullif(v_place->>'openingHoursText', '') is not null then
    insert into place_opening_hours(place_id, hours_text, confidence, verification_status, checked_at)
    values(v_place_id, v_place->>'openingHoursText', 0.7, 'verified', now())
    on conflict (place_id) do update set hours_text=excluded.hours_text, confidence=excluded.confidence, checked_at=excluded.checked_at, updated_at=now();
  end if;
  return new;
end;
$$;

revoke all on function sync_candidate_enrichment() from public, anon, authenticated;

drop trigger if exists trg_sync_candidate_enrichment on crawl_candidates;
create trigger trg_sync_candidate_enrichment after update of status on crawl_candidates
for each row execute function sync_candidate_enrichment();
