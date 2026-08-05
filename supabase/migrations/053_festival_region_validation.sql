-- Require every festival region to start with one of the 17 canonical
-- two-character regions, optionally followed by one space and detail text.

begin;

create or replace function public.is_valid_festival_region(p_region text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    p_region is not null
    and p_region = pg_catalog.btrim(p_region)
    and p_region ~ '^(서울|경기|인천|강원|대전|세종|충북|충남|광주|전북|전남|대구|경북|부산|울산|경남|제주)( [^[:space:]].*)?$';
$$;

create or replace function public.enforce_festival_region_format()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not public.is_valid_festival_region(new.region) then
    raise exception
      '지역은 서울 또는 충남 아산시처럼 표준 광역지역 2글자로 시작해야 합니다.'
      using errcode = '22023';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_festival_region_format on public.festivals;

create trigger enforce_festival_region_format
before insert or update of region on public.festivals
for each row execute function public.enforce_festival_region_format();

alter table public.festivals
  alter column region set not null;

alter table public.festivals
  drop constraint if exists festivals_region_format_check;

alter table public.festivals
  add constraint festivals_region_format_check
  check (public.is_valid_festival_region(region));

revoke all on function public.is_valid_festival_region(text)
from public, anon;
grant execute on function public.is_valid_festival_region(text)
to authenticated, service_role;

revoke all on function public.enforce_festival_region_format()
from public, anon;

comment on function public.is_valid_festival_region(text) is
  'Validates a required festival region as a canonical two-character region with optional detail.';

comment on constraint festivals_region_format_check on public.festivals is
  'Requires 서울 or 충남 아산시 style canonical festival region values.';

commit;
