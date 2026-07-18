-- 검토 초안 승인과 정식 축제 등록을 하나의 트랜잭션으로 처리한다.

begin;

create or replace function public.approve_festival_candidate(
  p_candidate_id bigint,
  p_draft jsonb,
  p_review_notes text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_existing_festival_id bigint;
  v_festival_id bigint;
  v_import_result jsonb;
  v_name text;
  v_start_date date;
  v_end_date date;
begin
  if not public.is_admin() then
    raise exception '관리자 권한이 필요합니다.'
      using errcode = '42501';
  end if;

  select festival_id
  into v_existing_festival_id
  from public.festival_candidates
  where id = p_candidate_id
  for update;

  if not found then
    raise exception '검토 후보를 찾을 수 없습니다.'
      using errcode = 'P0002';
  end if;

  if v_existing_festival_id is not null then
    raise exception '이미 정식 등록된 검토 후보입니다.'
      using errcode = '23505';
  end if;

  if p_draft is null
     or pg_catalog.jsonb_typeof(p_draft) <> 'object'
     or pg_catalog.jsonb_typeof(p_draft->'festival') <> 'object'
     or pg_catalog.jsonb_typeof(p_draft->'artists') <> 'array'
     or (
       p_draft ? 'tickets'
       and pg_catalog.jsonb_typeof(p_draft->'tickets') <> 'array'
     ) then
    raise exception '등록 가능한 축제 JSON 형식이 아닙니다.'
      using errcode = '22023';
  end if;

  v_name := nullif(pg_catalog.btrim(p_draft->'festival'->>'name'), '');
  v_start_date := nullif(p_draft->'festival'->>'start_date', '')::date;
  v_end_date := nullif(p_draft->'festival'->>'end_date', '')::date;

  v_import_result := public.import_festival_json(
    p_festival => p_draft->'festival',
    p_tickets => coalesce(p_draft->'tickets', '[]'::jsonb),
    p_artists => p_draft->'artists'
  );

  select id
  into v_festival_id
  from public.festivals
  where name = v_name
    and start_date = v_start_date
    and end_date = v_end_date
  order by id
  limit 1;

  if v_festival_id is null then
    raise exception '등록된 축제 ID를 확인할 수 없습니다.';
  end if;

  update public.festival_candidates
  set
    draft_json = p_draft,
    festival_name = v_name,
    start_date = v_start_date,
    end_date = v_end_date,
    location = nullif(p_draft->'festival'->>'location', ''),
    category = nullif(p_draft->'festival'->>'category', ''),
    status = 'approved',
    reject_reason = null,
    review_notes = nullif(pg_catalog.btrim(p_review_notes), ''),
    reviewed_at = pg_catalog.now(),
    reviewed_by = auth.uid(),
    festival_id = v_festival_id,
    updated_at = pg_catalog.now()
  where id = p_candidate_id;

  return pg_catalog.jsonb_build_object(
    'festival_id', v_festival_id,
    'import_result', v_import_result
  );
end;
$$;

revoke all
on function public.approve_festival_candidate(bigint, jsonb, text)
from public;

revoke all
on function public.approve_festival_candidate(bigint, jsonb, text)
from anon;

grant execute
on function public.approve_festival_candidate(bigint, jsonb, text)
to authenticated;

comment on function public.approve_festival_candidate(bigint, jsonb, text) is
  '관리자가 검토한 후보를 정식 축제 데이터로 원자적 등록하고 승인 상태와 festival_id를 기록';

commit;
