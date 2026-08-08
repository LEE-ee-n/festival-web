-- 공개 로그인 사용자의 관심·일정 데이터 보안 강화

begin;

revoke update, truncate, references, trigger
on table public.user_favorite_festivals,
  public.user_favorite_artists,
  public.user_schedule_items
from authenticated;

drop policy if exists "Users can add own favorite festivals"
on public.user_favorite_festivals;
create policy "Users can add own favorite festivals"
on public.user_favorite_festivals
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.festivals
    where festivals.id = user_favorite_festivals.festival_id
      and festivals.verification_status = 'approved'
      and festivals.status in ('scheduled', 'ongoing', 'ended')
  )
);

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
      and festival_artists.performance_date is not null
      and festival_artists.performance_time is not null
      and festivals.verification_status = 'approved'
      and festivals.status in ('scheduled', 'ongoing')
  )
);

commit;
