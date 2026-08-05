-- Migration 053 운영 적용 상태를 읽기 전용으로 확인한다.

-- 1. festivals.region이 NOT NULL인지 확인한다.
select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'festivals'
  and column_name = 'region';

-- 2. 지역 CHECK 제약이 등록됐는지 확인한다.
select
  conname as constraint_name,
  contype as constraint_type,
  convalidated as is_validated,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.festivals'::regclass
  and conname = 'festivals_region_format_check';

-- 3. 저장 전 검증 trigger가 활성화됐는지 확인한다.
select
  tgname as trigger_name,
  tgenabled as enabled,
  pg_get_triggerdef(oid) as definition
from pg_trigger
where tgrelid = 'public.festivals'::regclass
  and tgname = 'enforce_festival_region_format'
  and not tgisinternal;

-- 4. 검증 함수와 trigger 함수가 등록됐는지 확인한다.
select
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.provolatile as volatility
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'is_valid_festival_region',
    'enforce_festival_region_format'
  )
order by p.proname;

-- 5. 검증 함수가 허용·거부 예시를 정확히 판정하는지 확인한다.
with cases(region, expected) as (
  values
    ('서울'::text, true),
    ('충남 아산시'::text, true),
    ('경남 창원시'::text, true),
    (null::text, false),
    (''::text, false),
    ('충남아산시'::text, false),
    ('충남  아산시'::text, false),
    ('서울특별시'::text, false),
    ('창원'::text, false),
    ('해외'::text, false)
)
select
  region,
  expected,
  public.is_valid_festival_region(region) as actual,
  public.is_valid_festival_region(region) = expected as passed
from cases;

-- 6. 현재 데이터 중 규칙 위반 행이 남았는지 확인한다.
select
  id,
  name,
  region,
  location,
  address,
  status
from public.festivals
where not public.is_valid_festival_region(region)
order by id;
