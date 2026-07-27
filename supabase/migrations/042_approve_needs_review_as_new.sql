begin;

create or replace function public.approve_reviewed_festival_candidate(
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
  v_candidate public.festival_candidates%rowtype;
begin
  if not public.is_admin() then
    raise exception '관리자 권한이 필요합니다.' using errcode = '42501';
  end if;

  select * into v_candidate
  from public.festival_candidates
  where id = p_candidate_id
  for update;

  if not found then
    raise exception '검토 후보를 찾을 수 없습니다.' using errcode = 'P0002';
  end if;
  if v_candidate.status <> 'pending' then
    raise exception '검토 대기 상태의 작업만 승인할 수 있습니다.' using errcode = '22023';
  end if;
  if v_candidate.work_type not in ('new', 'needs_review') then
    raise exception '신규 또는 판별 확인 작업만 승인할 수 있습니다.' using errcode = '22023';
  end if;

  if v_candidate.work_type = 'needs_review' then
    update public.festival_candidates
    set work_type = 'new',
        comparison_json = pg_catalog.jsonb_set(
          coalesce(comparison_json, '{}'::jsonb),
          '{work_type}',
          '"new"'::jsonb,
          true
        ),
        updated_at = pg_catalog.now()
    where id = p_candidate_id;
  end if;

  return public.approve_new_festival_candidate(
    p_candidate_id,
    p_draft,
    p_review_notes
  );
end;
$$;

revoke all on function public.approve_reviewed_festival_candidate(
  bigint, jsonb, text
) from public, anon;

grant execute on function public.approve_reviewed_festival_candidate(
  bigint, jsonb, text
) to authenticated;

comment on function public.approve_reviewed_festival_candidate(
  bigint, jsonb, text
) is '관리자 최종 검토가 끝난 new 또는 needs_review 후보를 신규 축제로 원자 승인한다.';

commit;
