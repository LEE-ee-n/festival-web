-- Allow one artist to have multiple performance slots at the same festival.
-- A slot is matched by festival, artist, and performance date.

begin;

create or replace function public.import_festival_lineup(
  p_festival_id bigint,
  p_artists jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_row jsonb;

  v_artist_id bigint;
  v_artist_name text;
  v_artist_normalized_name text;

  v_alias jsonb;
  v_alias_name text;
  v_alias_normalized text;

  v_performance_date date;
  v_performance_time time;
  v_performance_end_time time;
  v_stage_name text;
  v_status text;
  v_lineup_id bigint;

  v_new_artist_count integer := 0;
  v_existing_artist_count integer := 0;
  v_linked_count integer := 0;
  v_already_linked_count integer := 0;
  v_alias_count integer := 0;
  v_affected integer := 0;
begin
  if not exists (
    select 1
    from public.festivals
    where id = p_festival_id
  ) then
    raise exception 'Festival does not exist. ID: %', p_festival_id;
  end if;

  if p_artists is null
     or pg_catalog.jsonb_typeof(p_artists) <> 'array'
     or pg_catalog.jsonb_array_length(p_artists) = 0 then
    raise exception 'No artists to import.';
  end if;

  -- Prevent two imports from modifying the same festival lineup concurrently.
  perform pg_catalog.pg_advisory_xact_lock(p_festival_id);

  for v_row in
    select value
    from pg_catalog.jsonb_array_elements(p_artists)
  loop
    v_artist_id := null;
    v_lineup_id := null;

    v_artist_name := pg_catalog.btrim(
      coalesce(v_row->>'display_name', v_row->>'input_name')
    );
    v_artist_normalized_name := pg_catalog.btrim(
      coalesce(v_row->>'normalized_name', '')
    );

    if coalesce(v_row->>'matched_artist_id', '') ~ '^[0-9]+$' then
      v_artist_id := (v_row->>'matched_artist_id')::bigint;

      select a.name, a.normalized_name
      into v_artist_name, v_artist_normalized_name
      from public.artists a
      where a.id = v_artist_id;

      if not found then
        raise exception 'Selected artist does not exist. ID: %', v_artist_id;
      end if;

      v_existing_artist_count := v_existing_artist_count + 1;
    else
      if v_artist_name is null or v_artist_name = '' then
        raise exception 'Artist name is empty.';
      end if;

      if v_artist_normalized_name !~ '^[a-z0-9]+$' then
        raise exception
          'Artist normalized_name must contain lowercase ASCII letters and digits only: %',
          v_artist_normalized_name;
      end if;

      select a.id
      into v_artist_id
      from public.artists a
      where a.normalized_name = v_artist_normalized_name
      order by a.id
      limit 1;

      if found then
        select a.name, a.normalized_name
        into v_artist_name, v_artist_normalized_name
        from public.artists a
        where a.id = v_artist_id;

        v_existing_artist_count := v_existing_artist_count + 1;
      else
        insert into public.artists (name, normalized_name)
        values (v_artist_name, v_artist_normalized_name)
        returning id into v_artist_id;

        v_new_artist_count := v_new_artist_count + 1;
      end if;
    end if;

    for v_alias in
      select value
      from pg_catalog.jsonb_array_elements(
        coalesce(v_row->'aliases', '[]'::jsonb)
      )
    loop
      v_alias_name := pg_catalog.btrim(v_alias::text, '"');
      v_alias_normalized := public.normalize_artist_name(v_alias_name);

      if v_alias_name <> ''
         and v_alias_normalized <> ''
         and v_alias_normalized <> coalesce(v_artist_normalized_name, '') then
        insert into public.artist_aliases (
          artist_id,
          alias_name,
          normalized_alias
        )
        values (
          v_artist_id,
          v_alias_name,
          v_alias_normalized
        )
        on conflict do nothing;

        get diagnostics v_affected = row_count;
        if v_affected = 1 then
          v_alias_count := v_alias_count + 1;
        end if;
      end if;
    end loop;

    v_performance_date := nullif(v_row->>'performance_date', '')::date;
    v_performance_time := nullif(v_row->>'performance_time', '')::time;
    v_performance_end_time :=
      nullif(v_row->>'performance_end_time', '')::time;
    v_stage_name := nullif(v_row->>'stage_name', '');
    v_status := coalesce(nullif(v_row->>'status', ''), 'confirmed');

    select fa.id
    into v_lineup_id
    from public.festival_artists fa
    where fa.festival_id = p_festival_id
      and fa.artist_id = v_artist_id
      and fa.performance_date is not distinct from v_performance_date
    order by fa.id
    limit 1
    for update;

    if found then
      update public.festival_artists
      set
        performance_time = v_performance_time,
        performance_end_time = v_performance_end_time,
        stage_name = v_stage_name,
        status = v_status
      where id = v_lineup_id;

      v_already_linked_count := v_already_linked_count + 1;
    else
      insert into public.festival_artists (
        festival_id,
        artist_id,
        performance_date,
        performance_time,
        performance_end_time,
        stage_name,
        status
      )
      values (
        p_festival_id,
        v_artist_id,
        v_performance_date,
        v_performance_time,
        v_performance_end_time,
        v_stage_name,
        v_status
      );

      v_linked_count := v_linked_count + 1;
    end if;
  end loop;

  return pg_catalog.jsonb_build_object(
    'festival_id', p_festival_id,
    'new_artist_count', v_new_artist_count,
    'existing_artist_count', v_existing_artist_count,
    'linked_count', v_linked_count,
    'already_linked_count', v_already_linked_count,
    'alias_count', v_alias_count
  );
end;
$$;

revoke all
on function public.import_festival_lineup(bigint, jsonb)
from public;

revoke all
on function public.import_festival_lineup(bigint, jsonb)
from anon;

grant execute
on function public.import_festival_lineup(bigint, jsonb)
to authenticated;

comment on function public.import_festival_lineup(bigint, jsonb) is
  'Imports lineup slots and allows the same artist on different performance dates.';

commit;
