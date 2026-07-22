begin;

-- 승인 뒤 임시저장을 눌러 pending으로 되돌아간 신규 등록 기록을 복구한다.
-- 신규 후보는 최종 승인 전에는 festival_id를 가질 수 없으므로 이 조건만 복구한다.
update public.festival_candidates
set status = 'approved',
    raw_text = null,
    draft_json = null,
    source_assets = '[]'::jsonb,
    comparison_json = '{}'::jsonb,
    reject_reason = null,
    reviewed_at = coalesce(reviewed_at, updated_at, pg_catalog.now())
where work_type = 'new'
  and festival_id is not null
  and status <> 'approved';

create or replace function public.lock_approved_festival_candidate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status = 'approved' then
    raise exception 'APPROVED_FESTIVAL_CANDIDATE_IS_READ_ONLY'
      using errcode = '55000';
  end if;
  return new;
end;
$$;

drop trigger if exists lock_approved_festival_candidate
on public.festival_candidates;

create trigger lock_approved_festival_candidate
before update on public.festival_candidates
for each row execute function public.lock_approved_festival_candidate();

revoke all on function public.lock_approved_festival_candidate()
from public, anon, authenticated;

comment on function public.lock_approved_festival_candidate() is
'승인 완료된 신규 페스티벌 등록 기록을 읽기 전용으로 고정한다.';

commit;
