-- Use festivals.normalized_name + start_date + end_date as the festival identity.
-- Existing invalid or duplicate data must be reviewed before this migration runs.

begin;

do $$
begin
  if exists (
    select 1
    from public.festivals
    where normalized_name is null
       or normalized_name !~ '^[a-z0-9]+$'
  ) then
    raise exception 'Invalid festivals.normalized_name values exist. Fix them before applying this migration.';
  end if;

  if exists (
    select 1
    from public.festivals
    group by normalized_name, start_date, end_date
    having count(*) > 1
  ) then
    raise exception 'Duplicate festival normalized_name and date combinations exist. Resolve them before applying this migration.';
  end if;
end;
$$;

alter table public.festivals
  alter column normalized_name set not null;

alter table public.festivals
  drop constraint if exists festivals_normalized_name_format;

alter table public.festivals
  add constraint festivals_normalized_name_format
  check (normalized_name ~ '^[a-z0-9]+$');

alter table public.festivals
  drop constraint if exists festivals_normalized_name_unique;

drop index if exists public.festivals_normalized_name_unique;
drop index if exists public.festivals_name_start_location_unique;
drop index if exists public.festivals_normalized_dates_unique;

create unique index festivals_normalized_dates_unique
on public.festivals (normalized_name, start_date, end_date);

comment on column public.festivals.normalized_name is
  'Festival identity key. Lowercase ASCII letters and digits only; unique with start_date and end_date.';

create or replace function public.import_festival_json(
  p_festival jsonb,
  p_tickets jsonb,
  p_artists jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_festival_id bigint;
  v_name text;
  v_normalized_name text;
  v_start_date date;
  v_end_date date;
  v_artists jsonb;
  v_lineup_result jsonb;
begin
  if not public.is_admin() then
    raise exception '관리자 권한이 필요합니다.'
      using errcode = '42501';
  end if;

  if p_festival is null
     or pg_catalog.jsonb_typeof(p_festival) <> 'object' then
    raise exception 'festival은 JSON 객체여야 합니다.'
      using errcode = '22023';
  end if;

  v_name := nullif(pg_catalog.btrim(p_festival->>'name'), '');
  v_normalized_name := nullif(
    pg_catalog.btrim(p_festival->>'normalized_name'),
    ''
  );
  v_start_date := nullif(p_festival->>'start_date', '')::date;
  v_end_date := nullif(p_festival->>'end_date', '')::date;

  if v_name is null
     or v_normalized_name is null
     or v_start_date is null
     or v_end_date is null then
    raise exception '축제명, normalized_name, 시작일, 종료일은 필수입니다.'
      using errcode = '22023';
  end if;

  if v_normalized_name !~ '^[a-z0-9]+$' then
    raise exception '축제 normalized_name은 영문 소문자와 숫자만 허용됩니다.'
      using errcode = '22023';
  end if;

  if v_end_date < v_start_date then
    raise exception '종료일은 시작일보다 빠를 수 없습니다.'
      using errcode = '22023';
  end if;

  v_artists := coalesce(p_artists, '[]'::jsonb);

  if pg_catalog.jsonb_typeof(v_artists) <> 'array' then
    raise exception 'artists는 JSON 배열이어야 합니다.'
      using errcode = '22023';
  end if;

  if p_tickets is not null
     and pg_catalog.jsonb_typeof(p_tickets) <> 'array' then
    raise exception 'tickets는 JSON 배열이어야 합니다.'
      using errcode = '22023';
  end if;

  select festivals.id
  into v_festival_id
  from public.festivals
  where festivals.normalized_name = v_normalized_name
    and festivals.start_date = v_start_date
    and festivals.end_date = v_end_date
  order by festivals.id
  limit 1
  for update;

  if v_festival_id is null then
    insert into public.festivals (
      name,
      normalized_name,
      search_aliases,
      start_date,
      end_date,
      location,
      address,
      region,
      category,
      description,
      price_info,
      program_info,
      source_url,
      official_url,
      thumbnail_url,
      price_type,
      status,
      verification_status
    )
    values (
      v_name,
      v_normalized_name,
      nullif(p_festival->>'search_aliases', ''),
      v_start_date,
      v_end_date,
      nullif(p_festival->>'location', ''),
      nullif(p_festival->>'address', ''),
      nullif(p_festival->>'region', ''),
      nullif(p_festival->>'category', ''),
      nullif(p_festival->>'description', ''),
      nullif(p_festival->>'price_info', ''),
      nullif(p_festival->>'program_info', ''),
      nullif(p_festival->>'source_url', ''),
      nullif(p_festival->>'official_url', ''),
      nullif(p_festival->>'thumbnail_url', ''),
      nullif(p_festival->>'price_type', ''),
      coalesce(nullif(p_festival->>'status', ''), 'scheduled'),
      'approved'
    )
    returning id into v_festival_id;
  else
    update public.festivals
    set
      name = v_name,
      normalized_name = v_normalized_name,
      search_aliases = nullif(p_festival->>'search_aliases', ''),
      start_date = v_start_date,
      end_date = v_end_date,
      location = nullif(p_festival->>'location', ''),
      address = nullif(p_festival->>'address', ''),
      region = nullif(p_festival->>'region', ''),
      category = nullif(p_festival->>'category', ''),
      description = nullif(p_festival->>'description', ''),
      price_info = nullif(p_festival->>'price_info', ''),
      program_info = nullif(p_festival->>'program_info', ''),
      source_url = nullif(p_festival->>'source_url', ''),
      official_url = nullif(p_festival->>'official_url', ''),
      thumbnail_url = nullif(p_festival->>'thumbnail_url', ''),
      price_type = nullif(p_festival->>'price_type', ''),
      status = coalesce(nullif(p_festival->>'status', ''), 'scheduled'),
      verification_status = 'approved'
    where id = v_festival_id;
  end if;

  if p_tickets is not null then
    delete from public.festival_ticket_rounds
    where festival_id = v_festival_id;

    insert into public.festival_ticket_rounds (
      festival_id,
      round_type,
      round_name,
      open_at,
      price_info,
      ticket_url,
      ticket_platform
    )
    select
      v_festival_id,
      nullif(ticket.value->>'round_type', ''),
      coalesce(nullif(ticket.value->>'round_name', ''), '일반 예매'),
      nullif(ticket.value->>'open_at', '')::timestamptz,
      nullif(ticket.value->>'price_info', ''),
      nullif(ticket.value->>'ticket_url', ''),
      nullif(ticket.value->>'ticket_platform', '')
    from pg_catalog.jsonb_array_elements(p_tickets) as ticket(value);
  end if;

  if pg_catalog.jsonb_array_length(v_artists) > 0 then
    select pg_catalog.to_jsonb(
      public.import_festival_lineup(
        p_festival_id => v_festival_id,
        p_artists => v_artists
      )
    )
    into v_lineup_result;
  else
    v_lineup_result := pg_catalog.jsonb_build_object(
      'new_artist_count', 0,
      'existing_artist_count', 0,
      'linked_count', 0,
      'already_linked_count', 0,
      'alias_count', 0
    );
  end if;

  return pg_catalog.jsonb_build_object(
    'festival_id', v_festival_id
  ) || coalesce(v_lineup_result, '{}'::jsonb);
end;
$$;

revoke all
on function public.import_festival_json(jsonb, jsonb, jsonb)
from public;

revoke all
on function public.import_festival_json(jsonb, jsonb, jsonb)
from anon;

grant execute
on function public.import_festival_json(jsonb, jsonb, jsonb)
to authenticated;

create or replace function public.import_festival_from_xlsx(
  p_festival jsonb,
  p_artists jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_festival_id bigint;
  v_artist jsonb;
  v_artist_id bigint;
  v_name text;
  v_normalized_name text;
  v_start_date date;
  v_end_date date;
  v_created_festival boolean := false;
  v_created_artists integer := 0;
  v_added_aliases integer := 0;
  v_added_lineup integer := 0;
  v_updated_lineup integer := 0;
  v_unchanged_lineup integer := 0;
  v_existing_date date;
  v_existing_time time;
  v_existing_end_time time;
  v_existing_stage text;
  v_existing_status text;
  v_alias text;
begin
  if not public.is_admin() then
    raise exception '관리자 권한이 필요합니다.'
      using errcode = '42501';
  end if;

  if p_festival is null
     or pg_catalog.jsonb_typeof(p_festival) <> 'object' then
    raise exception 'festival은 JSON 객체여야 합니다.'
      using errcode = '22023';
  end if;

  if p_artists is null
     or pg_catalog.jsonb_typeof(p_artists) <> 'array' then
    raise exception 'artists는 JSON 배열이어야 합니다.'
      using errcode = '22023';
  end if;

  v_name := nullif(pg_catalog.btrim(p_festival->>'name'), '');
  v_normalized_name := nullif(
    pg_catalog.btrim(p_festival->>'normalized_name'),
    ''
  );
  v_start_date := nullif(p_festival->>'start_date', '')::date;
  v_end_date := nullif(p_festival->>'end_date', '')::date;

  if v_name is null
     or v_normalized_name is null
     or v_start_date is null
     or v_end_date is null then
    raise exception '축제명, normalized_name, 시작일, 종료일은 필수입니다.'
      using errcode = '22023';
  end if;

  if v_normalized_name !~ '^[a-z0-9]+$' then
    raise exception '축제 normalized_name은 영문 소문자와 숫자만 허용됩니다.'
      using errcode = '22023';
  end if;

  if v_end_date < v_start_date then
    raise exception '종료일은 시작일보다 빠를 수 없습니다.'
      using errcode = '22023';
  end if;

  select festivals.id
  into v_festival_id
  from public.festivals
  where festivals.normalized_name = v_normalized_name
    and festivals.start_date = v_start_date
    and festivals.end_date = v_end_date
  order by festivals.id
  limit 1
  for update;

  if v_festival_id is null then
    insert into public.festivals (
      name,
      normalized_name,
      search_aliases,
      start_date,
      end_date,
      location,
      address,
      region,
      category,
      description,
      ticket_url,
      ticket_platform,
      price_info,
      program_info,
      official_url,
      source_url,
      thumbnail_url,
      price_type,
      status,
      verification_status
    )
    values (
      v_name,
      v_normalized_name,
      nullif(pg_catalog.btrim(p_festival->>'search_aliases'), ''),
      v_start_date,
      v_end_date,
      nullif(pg_catalog.btrim(p_festival->>'location'), ''),
      nullif(pg_catalog.btrim(p_festival->>'address'), ''),
      nullif(pg_catalog.btrim(p_festival->>'region'), ''),
      nullif(pg_catalog.btrim(p_festival->>'category'), ''),
      nullif(pg_catalog.btrim(p_festival->>'description'), ''),
      nullif(pg_catalog.btrim(p_festival->>'ticket_url'), ''),
      nullif(pg_catalog.btrim(p_festival->>'ticket_platform'), ''),
      nullif(pg_catalog.btrim(p_festival->>'price_info'), ''),
      nullif(pg_catalog.btrim(p_festival->>'program_info'), ''),
      nullif(pg_catalog.btrim(p_festival->>'official_url'), ''),
      nullif(pg_catalog.btrim(p_festival->>'source_url'), ''),
      nullif(pg_catalog.btrim(p_festival->>'thumbnail_url'), ''),
      nullif(pg_catalog.btrim(p_festival->>'price_type'), ''),
      coalesce(
        nullif(pg_catalog.btrim(p_festival->>'status'), ''),
        'scheduled'
      ),
      'approved'
    )
    returning id into v_festival_id;

    v_created_festival := true;
  end if;

  for v_artist in
    select value
    from pg_catalog.jsonb_array_elements(p_artists)
  loop
    if nullif(pg_catalog.btrim(v_artist->>'normalized_name'), '') is null
       or nullif(pg_catalog.btrim(v_artist->>'normalized_name'), '')
          !~ '^[a-z0-9]+$' then
      raise exception '아티스트 normalized_name은 영문 소문자와 숫자만 허용됩니다.'
        using errcode = '22023';
    end if;

    select artists.id
    into v_artist_id
    from public.artists
    where artists.normalized_name = pg_catalog.btrim(
      v_artist->>'normalized_name'
    )
    limit 1;

    if v_artist_id is null then
      insert into public.artists (
        name,
        normalized_name
      )
      values (
        coalesce(
          nullif(pg_catalog.btrim(v_artist->>'display_name'), ''),
          nullif(pg_catalog.btrim(v_artist->>'input_name'), '')
        ),
        nullif(pg_catalog.btrim(v_artist->>'normalized_name'), '')
      )
      returning id into v_artist_id;

      v_created_artists := v_created_artists + 1;
    end if;

    if nullif(pg_catalog.btrim(v_artist->>'aliases'), '') is not null then
      foreach v_alias in array pg_catalog.string_to_array(
        v_artist->>'aliases',
        '|'
      )
      loop
        v_alias := pg_catalog.btrim(v_alias);

        if v_alias <> ''
          and not exists (
            select 1
            from public.artist_aliases
            where alias_name = v_alias
          )
        then
          insert into public.artist_aliases (
            artist_id,
            alias_name,
            normalized_alias
          )
          values (
            v_artist_id,
            v_alias,
            public.normalize_artist_name(v_alias)
          );

          v_added_aliases := v_added_aliases + 1;
        end if;
      end loop;
    end if;

    select
      performance_date,
      performance_time,
      performance_end_time,
      stage_name,
      status
    into
      v_existing_date,
      v_existing_time,
      v_existing_end_time,
      v_existing_stage,
      v_existing_status
    from public.festival_artists
    where festival_id = v_festival_id
      and artist_id = v_artist_id;

    if not found then
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
        v_festival_id,
        v_artist_id,
        nullif(v_artist->>'performance_date', '')::date,
        nullif(v_artist->>'performance_time', '')::time,
        nullif(v_artist->>'performance_end_time', '')::time,
        nullif(pg_catalog.btrim(v_artist->>'stage_name'), ''),
        coalesce(
          nullif(pg_catalog.btrim(v_artist->>'status'), ''),
          'confirmed'
        )
      );

      v_added_lineup := v_added_lineup + 1;
    elsif
      v_existing_date is distinct from
        nullif(v_artist->>'performance_date', '')::date
      or v_existing_time is distinct from
        nullif(v_artist->>'performance_time', '')::time
      or v_existing_end_time is distinct from
        nullif(v_artist->>'performance_end_time', '')::time
      or v_existing_stage is distinct from
        nullif(pg_catalog.btrim(v_artist->>'stage_name'), '')
      or v_existing_status is distinct from
        coalesce(
          nullif(pg_catalog.btrim(v_artist->>'status'), ''),
          'confirmed'
        )
    then
      update public.festival_artists
      set
        performance_date =
          nullif(v_artist->>'performance_date', '')::date,
        performance_time =
          nullif(v_artist->>'performance_time', '')::time,
        performance_end_time =
          nullif(v_artist->>'performance_end_time', '')::time,
        stage_name =
          nullif(pg_catalog.btrim(v_artist->>'stage_name'), ''),
        status = coalesce(
          nullif(pg_catalog.btrim(v_artist->>'status'), ''),
          'confirmed'
        )
      where festival_id = v_festival_id
        and artist_id = v_artist_id;

      v_updated_lineup := v_updated_lineup + 1;
    else
      v_unchanged_lineup := v_unchanged_lineup + 1;
    end if;
  end loop;

  return pg_catalog.jsonb_build_object(
    'festival_id', v_festival_id,
    'created_festival', v_created_festival,
    'created_artists', v_created_artists,
    'added_aliases', v_added_aliases,
    'added_lineup', v_added_lineup,
    'updated_lineup', v_updated_lineup,
    'unchanged_lineup', v_unchanged_lineup
  );
end;
$$;

revoke all
on function public.import_festival_from_xlsx(jsonb, jsonb)
from public;

revoke all
on function public.import_festival_from_xlsx(jsonb, jsonb)
from anon;

grant execute
on function public.import_festival_from_xlsx(jsonb, jsonb)
to authenticated;

commit;
