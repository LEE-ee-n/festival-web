-- 크롤링·수동 수집 결과를 관리자가 검토한 뒤 등록하기 위한 초안 저장소

alter table public.festival_candidates
  alter column source_url drop not null,
  add column if not exists draft_json jsonb,
  add column if not exists source_assets jsonb not null default '[]'::jsonb,
  add column if not exists review_notes text,
  add column if not exists reviewed_by uuid;

alter table public.festival_candidates
  drop constraint if exists festival_candidates_reviewed_by_fkey;

alter table public.festival_candidates
  add constraint festival_candidates_reviewed_by_fkey
  foreign key (reviewed_by)
  references auth.users(id)
  on delete set null;

alter table public.festival_candidates enable row level security;

drop policy if exists "Admins can read festival candidates"
on public.festival_candidates;

create policy "Admins can read festival candidates"
on public.festival_candidates
for select
to authenticated
using ((select public.is_admin()));

drop policy if exists "Admins can insert festival candidates"
on public.festival_candidates;

create policy "Admins can insert festival candidates"
on public.festival_candidates
for insert
to authenticated
with check ((select public.is_admin()));

drop policy if exists "Admins can update festival candidates"
on public.festival_candidates;

create policy "Admins can update festival candidates"
on public.festival_candidates
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins can delete festival candidates"
on public.festival_candidates;

create policy "Admins can delete festival candidates"
on public.festival_candidates
for delete
to authenticated
using ((select public.is_admin()));

revoke all on table public.festival_candidates from anon;
grant select, insert, update, delete
on table public.festival_candidates
to authenticated;

revoke all on sequence public.festival_candidates_id_seq from anon;
grant usage, select
on sequence public.festival_candidates_id_seq
to authenticated;

comment on column public.festival_candidates.draft_json is
  '기존 import_festival_json 함수에 전달하기 전 관리자가 검토하는 전체 JSON 초안';

comment on column public.festival_candidates.source_assets is
  '수동 업로드 이미지와 추가 출처의 메타데이터 배열';

comment on column public.festival_candidates.review_notes is
  '관리자 검토 메모';

comment on column public.festival_candidates.reviewed_by is
  '마지막으로 승인 또는 거절한 관리자 계정';
