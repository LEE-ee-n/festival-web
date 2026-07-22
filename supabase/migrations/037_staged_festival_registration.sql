begin;

alter table public.festivals
add column if not exists timetable_status text not null default 'published';

alter table public.festivals
drop constraint if exists festivals_valid_timetable_status;

alter table public.festivals
add constraint festivals_valid_timetable_status
check (timetable_status in ('published', 'unpublished'));

alter table public.festival_artists
add column if not exists input_name text;

comment on column public.festivals.timetable_status is
'타임테이블 전체 공개 상태. unpublished이면 확정 라인업은 유지하되 일정은 공개하지 않는다.';

comment on column public.festival_artists.input_name is
'아티스트를 페스티벌에 최초 연결할 때 관리자가 확정한 포스터 표기. 기존 연결은 자동 갱신하지 않는다.';

create or replace function public.scrub_completed_festival_candidate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    new.raw_text := null;
    new.draft_json := null;
    new.source_assets := '[]'::jsonb;
    new.comparison_json := '{}'::jsonb;
  end if;
  return new;
end;
$$;

drop trigger if exists scrub_completed_festival_candidate
on public.festival_candidates;

create trigger scrub_completed_festival_candidate
before update of status on public.festival_candidates
for each row execute function public.scrub_completed_festival_candidate();

revoke all on function public.scrub_completed_festival_candidate()
from public, anon, authenticated;

commit;
