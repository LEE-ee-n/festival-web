-- 공개 사용자 관심 축제·아티스트 저장

begin;

create table if not exists public.user_favorite_festivals (
  user_id uuid not null references auth.users(id) on delete cascade,
  festival_id bigint not null references public.festivals(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, festival_id)
);

create table if not exists public.user_favorite_artists (
  user_id uuid not null references auth.users(id) on delete cascade,
  artist_id bigint not null references public.artists(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, artist_id)
);

alter table public.user_favorite_festivals enable row level security;
alter table public.user_favorite_artists enable row level security;

revoke all on table public.user_favorite_festivals from anon;
revoke all on table public.user_favorite_artists from anon;
grant select, insert, delete on table public.user_favorite_festivals to authenticated;
grant select, insert, delete on table public.user_favorite_artists to authenticated;

drop policy if exists "Users can read own favorite festivals" on public.user_favorite_festivals;
create policy "Users can read own favorite festivals"
on public.user_favorite_festivals
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can add own favorite festivals" on public.user_favorite_festivals;
create policy "Users can add own favorite festivals"
on public.user_favorite_festivals
for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can remove own favorite festivals" on public.user_favorite_festivals;
create policy "Users can remove own favorite festivals"
on public.user_favorite_festivals
for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can read own favorite artists" on public.user_favorite_artists;
create policy "Users can read own favorite artists"
on public.user_favorite_artists
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can add own favorite artists" on public.user_favorite_artists;
create policy "Users can add own favorite artists"
on public.user_favorite_artists
for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can remove own favorite artists" on public.user_favorite_artists;
create policy "Users can remove own favorite artists"
on public.user_favorite_artists
for delete to authenticated
using ((select auth.uid()) = user_id);

commit;
