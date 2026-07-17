-- profiles.role 기반 관리자 인증 및 쓰기 정책
-- 전제: 004_database_v1.sql에서 사용하는 기본 테이블과
-- artist_aliases, festival_ticket_rounds가 운영 DB에 존재해야 한다.

begin;

-- =========================================================
-- 1. 관리자 권한의 단일 기준: public.profiles.role
-- =========================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
add column if not exists role text default 'user',
add column if not exists created_at timestamptz default now(),
add column if not exists updated_at timestamptz default now();

update public.profiles
set
  role = coalesce(role, 'user'),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now())
where role is null
   or created_at is null
   or updated_at is null;

alter table public.profiles
alter column role set default 'user',
alter column role set not null,
alter column created_at set default now(),
alter column created_at set not null,
alter column updated_at set default now(),
alter column updated_at set not null;

alter table public.profiles enable row level security;

revoke insert, update, delete, truncate, references, trigger
on table public.profiles
from anon, authenticated;

grant select
on table public.profiles
to authenticated;

-- profiles의 기존 정책을 제거해 자신의 role을 변경하거나
-- 다른 사용자의 프로필을 읽는 우회 정책이 남지 않게 한다.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
  loop
    execute format(
      'drop policy if exists %I on public.profiles',
      policy_record.policyname
    );
  end loop;
end;
$$;

create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

-- =========================================================
-- 2. 공통 관리자 판별 함수
-- =========================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin() to service_role;

-- =========================================================
-- 3. 운영 DB에서 확인된 누락 칼럼
-- =========================================================

alter table public.festivals
add column if not exists search_aliases text,
add column if not exists normalized_name text;

alter table public.festival_artists
add column if not exists performance_end_time time;

-- =========================================================
-- 4. 관리자 화면에서 수정하는 테이블의 RLS 및 권한
-- =========================================================

alter table public.festivals enable row level security;
alter table public.artists enable row level security;
alter table public.artist_aliases enable row level security;
alter table public.festival_artists enable row level security;
alter table public.festival_ticket_rounds enable row level security;

grant insert, update, delete
on table
  public.festivals,
  public.artists,
  public.artist_aliases,
  public.festival_artists,
  public.festival_ticket_rounds
to authenticated;

-- 이름이 다른 예전 쓰기 정책도 모두 제거하고 관리자 정책으로 통일한다.
-- SELECT 정책은 공개 페이지 사용을 위해 유지한다.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'festivals',
        'artists',
        'artist_aliases',
        'festival_artists',
        'festival_ticket_rounds'
      )
      and cmd in ('ALL', 'INSERT', 'UPDATE', 'DELETE')
  loop
    execute format(
      'drop policy if exists %I on public.%I',
      policy_record.policyname,
      policy_record.tablename
    );
  end loop;
end;
$$;

create policy "Admins can insert festivals"
on public.festivals for insert to authenticated
with check ((select public.is_admin()));

create policy "Admins can update festivals"
on public.festivals for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins can delete festivals"
on public.festivals for delete to authenticated
using ((select public.is_admin()));

drop policy if exists "Admins can insert artists" on public.artists;
drop policy if exists "Admins can update artists" on public.artists;
drop policy if exists "Admins can delete artists" on public.artists;

create policy "Admins can insert artists"
on public.artists for insert to authenticated
with check ((select public.is_admin()));

create policy "Admins can update artists"
on public.artists for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins can delete artists"
on public.artists for delete to authenticated
using ((select public.is_admin()));

drop policy if exists "Admins can insert artist aliases" on public.artist_aliases;
drop policy if exists "Admins can update artist aliases" on public.artist_aliases;
drop policy if exists "Admins can delete artist aliases" on public.artist_aliases;

create policy "Admins can insert artist aliases"
on public.artist_aliases for insert to authenticated
with check ((select public.is_admin()));

create policy "Admins can update artist aliases"
on public.artist_aliases for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins can delete artist aliases"
on public.artist_aliases for delete to authenticated
using ((select public.is_admin()));

drop policy if exists "Admins can insert festival artists" on public.festival_artists;
drop policy if exists "Admins can update festival artists" on public.festival_artists;
drop policy if exists "Admins can delete festival artists" on public.festival_artists;

create policy "Admins can insert festival artists"
on public.festival_artists for insert to authenticated
with check ((select public.is_admin()));

create policy "Admins can update festival artists"
on public.festival_artists for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins can delete festival artists"
on public.festival_artists for delete to authenticated
using ((select public.is_admin()));

drop policy if exists "Admins can insert festival tickets" on public.festival_ticket_rounds;
drop policy if exists "Admins can update festival tickets" on public.festival_ticket_rounds;
drop policy if exists "Admins can delete festival tickets" on public.festival_ticket_rounds;

create policy "Admins can insert festival tickets"
on public.festival_ticket_rounds for insert to authenticated
with check ((select public.is_admin()));

create policy "Admins can update festival tickets"
on public.festival_ticket_rounds for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins can delete festival tickets"
on public.festival_ticket_rounds for delete to authenticated
using ((select public.is_admin()));

-- 운영 DB의 공개 조회 범위를 같은 형태로 재구성한다.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'festivals',
        'artists',
        'artist_aliases',
        'festival_artists',
        'festival_ticket_rounds'
      )
      and cmd = 'SELECT'
  loop
    execute format(
      'drop policy if exists %I on public.%I',
      policy_record.policyname,
      policy_record.tablename
    );
  end loop;
end;
$$;

grant select
on table
  public.festivals,
  public.artists,
  public.artist_aliases,
  public.festival_artists,
  public.festival_ticket_rounds
to anon, authenticated;

create policy "Public can read published festivals"
on public.festivals for select to anon, authenticated
using (
  verification_status = 'approved'
  and status in ('scheduled', 'ongoing', 'ended')
);

create policy "Admin can read all festivals"
on public.festivals for select to authenticated
using ((select public.is_admin()));

create policy "Public can read artists"
on public.artists for select to anon, authenticated
using (true);

create policy "Public can read artist aliases"
on public.artist_aliases for select to anon, authenticated
using (true);

create policy "Public can read active festival artists"
on public.festival_artists for select to anon, authenticated
using (
  status in ('scheduled', 'confirmed')
  and exists (
    select 1
    from public.festivals
    where festivals.id = festival_artists.festival_id
      and festivals.verification_status = 'approved'
      and festivals.status in ('scheduled', 'ongoing', 'ended')
  )
);

create policy "Admin can read all festival artists"
on public.festival_artists for select to authenticated
using ((select public.is_admin()));

create policy "Public can read festival ticket rounds"
on public.festival_ticket_rounds for select to anon, authenticated
using (
  exists (
    select 1
    from public.festivals
    where festivals.id = festival_ticket_rounds.festival_id
      and festivals.verification_status = 'approved'
      and festivals.status in ('scheduled', 'ongoing', 'ended')
  )
);

create policy "Admin can read all festival ticket rounds"
on public.festival_ticket_rounds for select to authenticated
using ((select public.is_admin()));

create index if not exists idx_festival_ticket_rounds_festival_id
on public.festival_ticket_rounds (festival_id);

-- =========================================================
-- 5. festival-thumbnails Storage 정책
-- =========================================================

drop policy if exists "Admin can insert festival thumbnails"
on storage.objects;
drop policy if exists "Admin can update festival thumbnails"
on storage.objects;
drop policy if exists "Admin can delete festival thumbnails"
on storage.objects;
drop policy if exists "Admin can select festival thumbnails"
on storage.objects;
drop policy if exists "Admins can upload festival thumbnails"
on storage.objects;
drop policy if exists "Admins can update festival thumbnails"
on storage.objects;
drop policy if exists "Admins can delete festival thumbnails"
on storage.objects;
drop policy if exists "Admins can select festival thumbnails"
on storage.objects;

create policy "Admins can select festival thumbnails"
on storage.objects for select to authenticated
using (
  bucket_id = 'festival-thumbnails'
  and (select public.is_admin())
);

create policy "Admins can upload festival thumbnails"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'festival-thumbnails'
  and (select public.is_admin())
);

create policy "Admins can update festival thumbnails"
on storage.objects for update to authenticated
using (
  bucket_id = 'festival-thumbnails'
  and (select public.is_admin())
)
with check (
  bucket_id = 'festival-thumbnails'
  and (select public.is_admin())
);

create policy "Admins can delete festival thumbnails"
on storage.objects for delete to authenticated
using (
  bucket_id = 'festival-thumbnails'
  and (select public.is_admin())
);

commit;
