-- 신규 등록 작업함과 승인 경로를 신규 축제 전용으로 제한한다.
begin;

create or replace function public.create_discord_new_festival_candidate(
  p_source_url text,
  p_draft jsonb,
  p_source_assets jsonb,
  p_announcement_round text,
  p_comparison jsonb,
  p_regenerate boolean default false
)
returns public.festival_candidates
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_normalized_name text;
  v_start_date date;
  v_end_date date;
  v_created public.festival_candidates;
begin
  if not public.is_festival_bot() then
    raise exception 'Discord Bot 권한이 필요합니다.' using errcode = '42501';
  end if;
  if p_draft is null
     or pg_catalog.jsonb_typeof(p_draft) <> 'object'
     or pg_catalog.jsonb_typeof(p_draft->'festival') <> 'object' then
    raise exception '등록 가능한 축제 JSON 형식이 아닙니다.' using errcode = '22023';
  end if;

  v_normalized_name := nullif(pg_catalog.btrim(p_draft->'festival'->>'normalized_name'), '');
  if v_normalized_name is null or v_normalized_name !~ '^[a-z0-9]+$' then
    raise exception '올바른 festival.normalized_name이 필요합니다.' using errcode = '22023';
  end if;
  if coalesce(p_draft->'festival'->>'start_date', '') !~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}$'
     or coalesce(p_draft->'festival'->>'end_date', '') !~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}$' then
    raise exception '축제 시작일과 종료일은 YYYY-MM-DD 형식이어야 합니다.' using errcode = '22023';
  end if;
  v_start_date := (p_draft->'festival'->>'start_date')::date;
  v_end_date := (p_draft->'festival'->>'end_date')::date;
  if v_end_date < v_start_date then
    raise exception '종료일은 시작일보다 빠를 수 없습니다.' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.festivals
    where normalized_name = v_normalized_name
      and start_date = v_start_date
      and end_date = v_end_date
  ) then
    raise exception 'EXISTING_FESTIVAL_NOT_NEW' using errcode = '23505';
  end if;

  select * into v_created
  from public.create_discord_festival_candidate(
    p_source_url, p_draft, p_source_assets, 'new', p_announcement_round,
    p_comparison, p_regenerate
  );
  return v_created;
end;
$$;

revoke all on function public.create_discord_festival_candidate(
  text, jsonb, jsonb, text, text, jsonb, boolean
) from authenticated;
revoke all on function public.create_discord_new_festival_candidate(
  text, jsonb, jsonb, text, jsonb, boolean
) from public, anon;
grant execute on function public.create_discord_new_festival_candidate(
  text, jsonb, jsonb, text, jsonb, boolean
) to authenticated;

create or replace function public.approve_new_festival_candidate(
  p_candidate_id bigint,
  p_draft jsonb,
  p_review_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_work_type text;
  v_status text;
  v_normalized_name text;
  v_start_date date;
  v_end_date date;
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception '관리자 권한이 필요합니다.' using errcode = '42501';
  end if;

  select work_type, status into v_work_type, v_status
  from public.festival_candidates
  where id = p_candidate_id
  for update;
  if not found then
    raise exception '검토 후보를 찾을 수 없습니다.' using errcode = 'P0002';
  end if;
  if v_work_type <> 'new' then
    raise exception '신규 축제 작업만 승인할 수 있습니다.' using errcode = '22023';
  end if;
  if v_status <> 'pending' then
    raise exception '검수 대기 상태의 작업만 승인할 수 있습니다.' using errcode = '22023';
  end if;
  if p_draft is null
     or pg_catalog.jsonb_typeof(p_draft) <> 'object'
     or pg_catalog.jsonb_typeof(p_draft->'festival') <> 'object' then
    raise exception '등록 가능한 축제 JSON 형식이 아닙니다.' using errcode = '22023';
  end if;

  v_normalized_name := nullif(pg_catalog.btrim(p_draft->'festival'->>'normalized_name'), '');
  if v_normalized_name is null or v_normalized_name !~ '^[a-z0-9]+$' then
    raise exception '올바른 festival.normalized_name이 필요합니다.' using errcode = '22023';
  end if;
  v_start_date := nullif(p_draft->'festival'->>'start_date', '')::date;
  v_end_date := nullif(p_draft->'festival'->>'end_date', '')::date;
  if v_start_date is null or v_end_date is null or v_end_date < v_start_date then
    raise exception '올바른 축제 시작일과 종료일이 필요합니다.' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      v_normalized_name || '|' || v_start_date::text || '|' || v_end_date::text,
      0
    )
  );
  if exists (
    select 1 from public.festivals
    where normalized_name = v_normalized_name
      and start_date = v_start_date
      and end_date = v_end_date
  ) then
    raise exception '이미 등록된 축제입니다. 페스티벌 관리에서 처리해 주세요.' using errcode = '23505';
  end if;

  v_result := public.approve_festival_candidate(
    p_candidate_id, p_draft, p_review_notes
  );
  return v_result;
end;
$$;

revoke all on function public.approve_festival_candidate(bigint, jsonb, text)
from authenticated;
revoke all on function public.approve_new_festival_candidate(bigint, jsonb, text)
from public, anon;
grant execute on function public.approve_new_festival_candidate(bigint, jsonb, text)
to authenticated;

comment on function public.create_discord_new_festival_candidate(
  text, jsonb, jsonb, text, jsonb, boolean
) is 'Discord Bot이 완전한 식별값을 가진 신규 축제만 작업함에 저장';
comment on function public.approve_new_festival_candidate(bigint, jsonb, text)
is '신규 작업을 승인하되 동일 식별값의 기존 축제가 있으면 중단';

commit;
