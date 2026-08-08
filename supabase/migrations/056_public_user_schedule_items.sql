-- 공개 사용자가 선택한 페스티벌 공연

begin;

create table if not exists public.user_schedule_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  festival_artist_id bigint not null references public.festival_artists(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, festival_artist_id)
);

alter table public.user_schedule_items enable row level security;

revoke all on table public.user_schedule_items from anon;
grant select, insert, delete on table public.user_schedule_items to authenticated;

drop policy if exists "Users can read own schedule items" on public.user_schedule_items;
create policy "Users can read own schedule items"
on public.user_schedule_items
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can add own schedule items" on public.user_schedule_items;
create policy "Users can add own schedule items"
on public.user_schedule_items
for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can remove own schedule items" on public.user_schedule_items;
create policy "Users can remove own schedule items"
on public.user_schedule_items
for delete to authenticated
using ((select auth.uid()) = user_id);

commit;
