begin;

alter table public.artists
add column if not exists instagram_url text,
add column if not exists featured_playlist_url text;

alter table public.artists
drop constraint if exists artists_instagram_url_format,
drop constraint if exists artists_featured_playlist_url_format;

alter table public.artists
add constraint artists_instagram_url_format
check (
  instagram_url is null
  or instagram_url ~ '^https://(www[.])?instagram[.]com/[^/?#]+/?([?].*)?$'
),
add constraint artists_featured_playlist_url_format
check (
  featured_playlist_url is null
  or featured_playlist_url ~ '^https://(www[.])?(youtube[.]com|music[.]youtube[.]com)/playlist[?][^#]*list=[^&#]+'
);

create or replace function public.update_artist_admin(
  p_artist_id bigint,
  p_name text,
  p_normalized_name text,
  p_aliases text[] default '{}'::text[],
  p_instagram_url text default null,
  p_featured_playlist_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before public.artists%rowtype;
  v_name text := nullif(pg_catalog.btrim(p_name), '');
  v_normalized_name text := pg_catalog.btrim(p_normalized_name);
  v_instagram_url text := case
    when p_instagram_url is null then null
    else nullif(pg_catalog.btrim(p_instagram_url), '')
  end;
  v_featured_playlist_url text := case
    when p_featured_playlist_url is null then null
    else nullif(pg_catalog.btrim(p_featured_playlist_url), '')
  end;
  v_alias text;
  v_normalized_alias text;
  v_event_id bigint;
  v_old_aliases text[];
  v_new_aliases text[];
begin
  if not public.is_admin() then raise exception '관리자 권한이 필요합니다.' using errcode = '42501'; end if;
  if v_name is null or v_normalized_name !~ '^[a-z0-9]+$' then
    raise exception '아티스트 이름과 normalized_name을 확인해 주세요.' using errcode = '22023';
  end if;
  if v_instagram_url is not null and v_instagram_url !~ '^https://(www[.])?instagram[.]com/[^/?#]+/?([?].*)?$' then
    raise exception 'Instagram 공식 프로필 URL만 입력할 수 있습니다.' using errcode = '22023';
  end if;
  if v_featured_playlist_url is not null and v_featured_playlist_url !~ '^https://(www[.])?(youtube[.]com|music[.]youtube[.]com)/playlist[?][^#]*list=[^&#]+' then
    raise exception 'YouTube 또는 YouTube Music 재생목록 URL만 입력할 수 있습니다.' using errcode = '22023';
  end if;

  select * into v_before from public.artists where id = p_artist_id for update;
  if not found then raise exception '아티스트를 찾을 수 없습니다.' using errcode = 'P0002'; end if;

  if exists (select 1 from public.artists where normalized_name = v_normalized_name and id <> p_artist_id) then
    raise exception '같은 normalized_name을 사용하는 아티스트가 있습니다.' using errcode = '23505';
  end if;
  if exists (
    select 1 from public.artist_aliases aa
    join pg_catalog.unnest(coalesce(p_aliases, '{}'::text[])) input_alias(alias_name)
      on pg_catalog.lower(pg_catalog.btrim(aa.alias_name)) = pg_catalog.lower(pg_catalog.btrim(input_alias.alias_name))
    where aa.artist_id <> p_artist_id and nullif(pg_catalog.btrim(input_alias.alias_name), '') is not null
  ) then raise exception '입력한 별칭이 다른 아티스트에 등록되어 있습니다.' using errcode = '23505'; end if;

  insert into public.audit_events (
    actor_id, actor_name, action_type, festival_name, target_type, target_id, target_label
  ) values (
    auth.uid(), public.audit_actor_name(), 'artist.updated', null,
    'artist', p_artist_id::text, v_before.name
  ) returning id into v_event_id;

  select coalesce(pg_catalog.array_agg(alias_name order by pg_catalog.lower(alias_name)), '{}'::text[])
  into v_old_aliases from public.artist_aliases where artist_id = p_artist_id;
  select coalesce(pg_catalog.array_agg(alias_name order by pg_catalog.lower(alias_name)), '{}'::text[])
  into v_new_aliases from (
    select distinct pg_catalog.btrim(value) as alias_name
    from pg_catalog.unnest(coalesce(p_aliases, '{}'::text[])) value
    where nullif(pg_catalog.btrim(value), '') is not null
  ) normalized_input;

  if v_before.name is distinct from v_name
    or v_before.normalized_name is distinct from v_normalized_name
    or (p_instagram_url is not null and v_before.instagram_url is distinct from v_instagram_url)
    or (p_featured_playlist_url is not null and v_before.featured_playlist_url is distinct from v_featured_playlist_url)
  then
    update public.artists set
      name = v_name,
      normalized_name = v_normalized_name,
      instagram_url = case when p_instagram_url is null then instagram_url else v_instagram_url end,
      featured_playlist_url = case when p_featured_playlist_url is null then featured_playlist_url else v_featured_playlist_url end
    where id = p_artist_id;
  end if;

  if v_old_aliases is distinct from v_new_aliases then
    delete from public.artist_aliases where artist_id = p_artist_id;

    for v_alias in select pg_catalog.unnest(v_new_aliases)
    loop
      v_normalized_alias := public.normalize_artist_name(v_alias);
      insert into public.artist_aliases (artist_id, alias_name, normalized_alias)
      values (p_artist_id, v_alias, coalesce(nullif(v_normalized_alias, ''), v_normalized_name));
    end loop;
  end if;

  if not exists (select 1 from public.audit_changes where event_id = v_event_id) then
    raise exception '실제로 변경된 아티스트 정보가 없습니다.' using errcode = '22023';
  end if;

  return pg_catalog.jsonb_build_object(
    'id', p_artist_id,
    'name', v_name,
    'normalized_name', v_normalized_name,
    'aliases', coalesce(p_aliases, '{}'::text[]),
    'instagram_url', case when p_instagram_url is null then v_before.instagram_url else v_instagram_url end,
    'featured_playlist_url', case when p_featured_playlist_url is null then v_before.featured_playlist_url else v_featured_playlist_url end
  );
end;
$$;

revoke all on function public.update_artist_admin(bigint, text, text, text[], text, text)
from public, anon;

grant execute on function public.update_artist_admin(bigint, text, text, text[], text, text)
to authenticated;

commit;
