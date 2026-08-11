begin;

create or replace function public.update_artists_from_excel(
  p_artists jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row jsonb;
  v_artist_id bigint;
  v_name text;
  v_normalized_name text;
  v_aliases jsonb;
  v_alias text;
  v_normalized_alias text;
  v_updated_count integer := 0;
  v_alias_count integer := 0;
begin
  if not coalesce(public.is_admin(), false) then
    raise exception 'Administrator access required.' using errcode = '42501';
  end if;

  if p_artists is null
     or pg_catalog.jsonb_typeof(p_artists) <> 'array'
     or pg_catalog.jsonb_array_length(p_artists) = 0 then
    raise exception 'No artists were provided.' using errcode = '22023';
  end if;

  for v_row in
    select value
    from pg_catalog.jsonb_array_elements(p_artists)
  loop
    v_artist_id := (v_row ->> 'id')::bigint;
    v_name := pg_catalog.btrim(coalesce(v_row ->> 'name', ''));
    v_normalized_name := pg_catalog.btrim(
      coalesce(v_row ->> 'normalized_name', '')
    );
    v_aliases := coalesce(v_row -> 'aliases', '[]'::jsonb);

    if v_name = '' then
      raise exception 'Artist name is required. ID: %', v_artist_id
        using errcode = '22023';
    end if;

    if v_normalized_name = '' then
      v_normalized_name := public.normalize_artist_name(v_name);
    end if;

    if not exists (
      select 1
      from public.artists
      where id = v_artist_id
    ) then
      raise exception 'Artist does not exist. ID: %', v_artist_id
        using errcode = 'P0002';
    end if;

    update public.artists
    set name = v_name,
        normalized_name = v_normalized_name
    where id = v_artist_id;

    delete from public.artist_aliases
    where artist_id = v_artist_id;

    for v_alias in
      select value
      from pg_catalog.jsonb_array_elements_text(v_aliases)
    loop
      v_alias := pg_catalog.btrim(v_alias);

      if v_alias = '' or v_alias = v_name then
        continue;
      end if;

      v_normalized_alias := public.normalize_artist_name(v_alias);

      if v_normalized_alias = '' then
        continue;
      end if;

      if exists (
        select 1
        from public.artist_aliases alias
        where alias.alias_name = v_alias
          and alias.artist_id <> v_artist_id
      ) then
        raise exception 'Alias is already used by another artist: %', v_alias
          using errcode = '23505';
      end if;

      insert into public.artist_aliases (
        artist_id,
        alias_name,
        normalized_alias
      )
      values (
        v_artist_id,
        v_alias,
        v_normalized_alias
      )
      on conflict do nothing;

      v_alias_count := v_alias_count + 1;
    end loop;

    v_updated_count := v_updated_count + 1;
  end loop;

  return pg_catalog.jsonb_build_object(
    'updated_count', v_updated_count,
    'alias_count', v_alias_count
  );
end;
$$;

revoke all
on function public.update_artists_from_excel(jsonb)
from public, anon;

grant execute
on function public.update_artists_from_excel(jsonb)
to authenticated, service_role;

revoke all
on function public.refresh_festival_statuses(),
  public.update_festival_statuses()
from public, anon, authenticated;

grant execute
on function public.refresh_festival_statuses(),
  public.update_festival_statuses()
to service_role;

revoke all
on function public.audit_artist_alias_row_change(),
  public.audit_artist_row_change(),
  public.handle_new_user(),
  public.set_festival_update_draft_base_version()
from public, anon, authenticated, service_role;

revoke all
on function public.set_artist_display_name(bigint, text)
from public, anon;

grant execute
on function public.set_artist_display_name(bigint, text)
to authenticated, service_role;

commit;
