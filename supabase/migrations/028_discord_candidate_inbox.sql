-- Discord Bot 후보 버전, 제한 권한, 검수 포스터 저장소
begin;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('user', 'admin', 'bot'));

alter table public.festival_candidates drop constraint if exists festival_candidates_source_url_unique;
alter table public.festival_candidates
  add column if not exists work_type text not null default 'new',
  add column if not exists announcement_round text not null default 'unspecified',
  add column if not exists version_number integer not null default 1,
  add column if not exists parent_candidate_id bigint,
  add column if not exists created_by uuid,
  add column if not exists comparison_json jsonb not null default '{}'::jsonb;

alter table public.festival_candidates drop constraint if exists festival_candidates_valid_work_type;
alter table public.festival_candidates add constraint festival_candidates_valid_work_type
  check (work_type in ('new', 'update', 'needs_review'));
alter table public.festival_candidates drop constraint if exists festival_candidates_positive_version;
alter table public.festival_candidates add constraint festival_candidates_positive_version check (version_number > 0);
alter table public.festival_candidates drop constraint if exists festival_candidates_parent_candidate_id_fkey;
alter table public.festival_candidates add constraint festival_candidates_parent_candidate_id_fkey
  foreign key (parent_candidate_id) references public.festival_candidates(id) on delete set null;
alter table public.festival_candidates drop constraint if exists festival_candidates_created_by_fkey;
alter table public.festival_candidates add constraint festival_candidates_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;

create unique index if not exists festival_candidates_source_version_unique
  on public.festival_candidates (source_url, version_number) where source_url is not null;
create index if not exists idx_festival_candidates_work_type
  on public.festival_candidates (work_type, status, created_at desc);

create or replace function public.is_festival_bot() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'bot'
  );
$$;
revoke all on function public.is_festival_bot() from public, anon;
grant execute on function public.is_festival_bot() to authenticated;

drop policy if exists "Festival bot can read own candidates" on public.festival_candidates;
create policy "Festival bot can read own candidates" on public.festival_candidates
  for select to authenticated
  using (public.is_festival_bot() and created_by = (select auth.uid()));

create or replace function public.create_discord_festival_candidate(
  p_source_url text, p_draft jsonb, p_source_assets jsonb,
  p_work_type text, p_announcement_round text, p_comparison jsonb,
  p_regenerate boolean default false
)
returns public.festival_candidates
language plpgsql security definer set search_path = '' as $$
declare
  v_previous public.festival_candidates;
  v_created public.festival_candidates;
  v_version integer := 1;
begin
  if not public.is_festival_bot() then
    raise exception 'Discord Bot 권한이 필요합니다.' using errcode = '42501';
  end if;
  if p_source_url is null or p_source_url !~ '^https://(www\.)?instagram\.com/(p|reel)/' then
    raise exception '올바른 Instagram 게시물 URL이 필요합니다.' using errcode = '22023';
  end if;

  select * into v_previous from public.festival_candidates
  where source_url = p_source_url order by version_number desc limit 1;
  if found and not p_regenerate then
    raise exception 'DUPLICATE_SOURCE_URL' using errcode = '23505';
  end if;
  if found then v_version := v_previous.version_number + 1; end if;

  insert into public.festival_candidates (
    title, source_url, source_type, raw_text, festival_name, start_date,
    end_date, location, category, score, status, draft_json, source_assets,
    work_type, announcement_round, version_number, parent_candidate_id,
    created_by, comparison_json
  ) values (
    coalesce(nullif(p_draft->'candidate'->>'title', ''), p_draft->'festival'->>'name', 'Instagram 축제 후보'),
    p_source_url, 'instagram_discord', p_draft->'candidate'->>'raw_text',
    p_draft->'festival'->>'name',
    case when p_draft->'festival'->>'start_date' ~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}$'
      then (p_draft->'festival'->>'start_date')::date else null end,
    case when p_draft->'festival'->>'end_date' ~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}$'
      then (p_draft->'festival'->>'end_date')::date else null end,
    nullif(p_draft->'festival'->>'location', ''), nullif(p_draft->'festival'->>'category', ''),
    coalesce((p_draft->'candidate'->>'score')::integer, 0), 'pending', p_draft,
    coalesce(p_source_assets, '[]'::jsonb), p_work_type,
    coalesce(nullif(p_announcement_round, ''), 'unspecified'), v_version,
    case when v_previous.id is null then null else coalesce(v_previous.parent_candidate_id, v_previous.id) end,
    auth.uid(), coalesce(p_comparison, '{}'::jsonb)
  ) returning * into v_created;
  return v_created;
end;
$$;
revoke all on function public.create_discord_festival_candidate(text,jsonb,jsonb,text,text,jsonb,boolean) from public, anon;
grant execute on function public.create_discord_festival_candidate(text,jsonb,jsonb,text,text,jsonb,boolean) to authenticated;

insert into storage.buckets (id, name, public)
values ('festival-candidate-posters', 'festival-candidate-posters', false)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Festival bot can upload candidate posters" on storage.objects;
create policy "Festival bot can upload candidate posters" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'festival-candidate-posters' and public.is_festival_bot()
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
drop policy if exists "Festival bot can read own candidate posters" on storage.objects;
create policy "Festival bot can read own candidate posters" on storage.objects
  for select to authenticated using (
    bucket_id = 'festival-candidate-posters' and public.is_festival_bot()
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
drop policy if exists "Admins can read candidate posters" on storage.objects;
create policy "Admins can read candidate posters" on storage.objects
  for select to authenticated using (bucket_id = 'festival-candidate-posters' and public.is_admin());

commit;
