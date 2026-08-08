-- 시간표 공개 전에도 사용자가 보고 싶은 아티스트를 선택할 수 있게 한다.
-- 본인 데이터, 승인된 페스티벌, 진행 가능한 라인업 조건은 그대로 유지한다.

begin;

drop policy if exists "Users can add own schedule items"
on public.user_schedule_items;

create policy "Users can add own schedule items"
on public.user_schedule_items
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.festival_artists
    join public.festivals
      on festivals.id = festival_artists.festival_id
    where festival_artists.id = user_schedule_items.festival_artist_id
      and festival_artists.status in ('scheduled', 'confirmed')
      and festivals.verification_status = 'approved'
      and festivals.status in ('scheduled', 'ongoing')
  )
);

commit;
