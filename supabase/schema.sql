-- ============================================================
-- ScanovaX — Supabase Schema
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- 1. PROFILES (extends auth.users)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  plan        text not null default 'free' check (plan in ('free', 'pro')),
  created_at  timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. QR CODES
create table if not exists public.qr_codes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null default 'My QR Code',
  type        text not null default 'url',
  content     text not null default '',
  fg_color    text not null default '#0f172a',
  bg_color    text not null default '#ffffff',
  ec_level    text not null default 'M',
  frame       text not null default 'None',
  shape       text not null default 'Square',
  status      text not null default 'active' check (status in ('active', 'paused')),
  scan_count  bigint not null default 0,
  created_at  timestamptz not null default now()
);

-- 3. SCAN EVENTS
create table if not exists public.scan_events (
  id           uuid primary key default gen_random_uuid(),
  qr_code_id   uuid not null references public.qr_codes(id) on delete cascade,
  scanned_at   timestamptz not null default now(),
  country      text,
  device_type  text check (device_type in ('desktop', 'mobile'))
);

-- 4. LEAD CAPTURES (for lead capture feature)
create table if not exists public.lead_captures (
  id uuid primary key default gen_random_uuid(),
  qr_code_id uuid not null references public.qr_codes(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  city text default 'Unknown',
  country text default 'Unknown',
  device_type text default 'desktop',
  ip_address text default 'Unknown',
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles    enable row level security;
alter table public.qr_codes    enable row level security;
alter table public.scan_events enable row level security;

-- Profiles: own row only
drop policy if exists "profiles: select own" on public.profiles;
create policy "profiles: select own" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);

-- QR Codes: own rows only
drop policy if exists "qr_codes: select own" on public.qr_codes;
create policy "qr_codes: select own" on public.qr_codes
  for select using (auth.uid() = user_id);
drop policy if exists "qr_codes: insert own" on public.qr_codes;
create policy "qr_codes: insert own" on public.qr_codes
  for insert with check (auth.uid() = user_id);
drop policy if exists "qr_codes: update own" on public.qr_codes;
create policy "qr_codes: update own" on public.qr_codes
  for update using (auth.uid() = user_id);
drop policy if exists "qr_codes: delete own" on public.qr_codes;
create policy "qr_codes: delete own" on public.qr_codes
  for delete using (auth.uid() = user_id);

-- Scan Events: readable by owner of the parent QR code
drop policy if exists "scan_events: select own" on public.scan_events;
create policy "scan_events: select own" on public.scan_events
  for select using (
    exists (
      select 1 from public.qr_codes
      where qr_codes.id = scan_events.qr_code_id
        and qr_codes.user_id = auth.uid()
    )
  );
drop policy if exists "scan_events: insert anon" on public.scan_events;
create policy "scan_events: insert anon" on public.scan_events
  for insert with check (true);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists qr_codes_user_id_idx    on public.qr_codes (user_id);
create index if not exists scan_events_qr_code_idx on public.scan_events (qr_code_id);
create index if not exists scan_events_scanned_at  on public.scan_events (scanned_at);

-- ============================================================
-- ANALYTICS: Additional columns and functions
-- ============================================================

-- Add lead capture support to QR codes
alter table public.qr_codes add column if not exists lead_capture_enabled boolean default false;

-- Add missing columns for analytics if they don't exist
alter table public.profiles add column if not exists monthly_scan_count bigint default 0;
alter table public.scan_events add column if not exists scanner_email text;
alter table public.scan_events add column if not exists state text;
alter table public.scan_events add column if not exists city text;
alter table public.scan_events add column if not exists ip_address text;
alter table public.scan_events add column if not exists user_identifier text;

-- Enable RLS on lead_captures and add policies
alter table public.lead_captures enable row level security;

drop policy if exists "lead_captures: public insert" on public.lead_captures;
create policy "lead_captures: public insert" on public.lead_captures
  for insert with check (true);

drop policy if exists "lead_captures: users select own" on public.lead_captures;
create policy "lead_captures: users select own" on public.lead_captures
  for select using (
    exists (
      select 1 from public.qr_codes
      where qr_codes.id = lead_captures.qr_code_id
        and qr_codes.user_id = auth.uid()
    )
  );

-- Add indexes for lead_captures
create index if not exists lead_captures_qr_code_idx on public.lead_captures(qr_code_id);
create index if not exists lead_captures_user_id_idx  on public.lead_captures(user_id);

-- ============================================================
-- SCAN COUNTER FUNCTION WITH DEDUPLICATION
-- ============================================================

-- Drop the old function if it exists (to avoid return type conflicts)
drop function if exists public.increment_scan(uuid, text, text, text, text, text, text, text);

-- Increment scan count with 5-second deduplication window
-- This prevents double-counting from React Strict Mode, double-clicks, retries, etc.
create or replace function public.increment_scan(
  target_qr_id uuid,
  scanner_email text default null,
  device_type text default 'desktop',
  country text default 'Unknown',
  state text default 'Unknown',
  city text default 'Unknown',
  ip_address text default 'Unknown',
  user_identifier text default 'Anonymous'
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_result json;
  v_existing_count bigint;
  v_new_count bigint;
begin
  -- Ensure parameters are not too long to avoid column constraint issues
  if length(COALESCE(user_identifier, '')) > 255 then
    user_identifier := substring(user_identifier, 1, 255);
  end if;
  
  if length(COALESCE(ip_address, '')) > 255 then
    ip_address := substring(ip_address, 1, 255);
  end if;

  -- DEDUPLICATION: Prevent duplicate scans from same user within 5 seconds
  if exists (
    select 1 from public.scan_events 
    where qr_code_id = target_qr_id 
    and COALESCE(user_identifier, 'Anonymous') = COALESCE(increment_scan.user_identifier, 'Anonymous')
    and scanned_at > now() - interval '5 seconds'
  ) then
    return json_build_object('status', 'duplicate', 'message', 'Duplicate scan within 5 seconds');
  end if;

  -- Get the user_id for the QR code
  select qr_codes.user_id, COALESCE(qr_codes.scan_count, 0)
  into v_user_id, v_existing_count
  from public.qr_codes 
  where id = target_qr_id;
  
  if v_user_id is null then
    return json_build_object('status', 'error', 'message', 'QR code not found');
  end if;

  -- Calculate new count
  v_new_count := v_existing_count + 1;

  -- UPDATE SCAN COUNT (primary counter)
  update public.qr_codes
  set scan_count = v_new_count
  where id = target_qr_id;

  -- UPDATE MONTHLY COUNTER for the user
  update public.profiles 
  set monthly_scan_count = coalesce(monthly_scan_count, 0) + 1 
  where id = v_user_id;

  -- LOG AUDIT EVENT
  insert into public.scan_events (
    qr_code_id,
    scanner_email,
    device_type,
    country,
    state,
    city,
    ip_address,
    user_identifier,
    scanned_at
  )
  values (
    target_qr_id,
    scanner_email,
    device_type,
    country,
    state,
    city,
    ip_address,
    user_identifier,
    now()
  );

  v_result := json_build_object(
    'status', 'success',
    'message', 'Scan recorded successfully',
    'qr_id', target_qr_id::text,
    'user_id', v_user_id::text,
    'new_scan_count', v_new_count
  );
  
  return v_result;
exception when others then
  return json_build_object(
    'status', 'error',
    'message', SQLERRM,
    'error_code', SQLSTATE
  );
end;
$$;

-- Grant permissions to call the function
grant execute on function public.increment_scan to anon, authenticated;
