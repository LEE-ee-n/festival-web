begin;

alter table public.audit_events
add column if not exists work_type text,
add column if not exists lineup_round text,
add column if not exists announcement_date date,
add column if not exists source_url text,
add column if not exists reason text;

alter table public.audit_events
drop constraint if exists audit_events_valid_work_type,
add constraint audit_events_valid_work_type
check (work_type is null or work_type in ('announcement', 'correction'));

alter table public.audit_events
drop constraint if exists audit_events_valid_lineup_round,
add constraint audit_events_valid_lineup_round
check (
  lineup_round is null
  or lineup_round in ('unspecified', 'first', 'second', 'third', 'final')
);

create or replace function public.apply_lineup_work_with_audit(
  p_festival_id bigint,
  p_work_type text,
  p_lineup_round text,
  p_announcement_date date,
  p_source_url text,
  p_reason text,
  p_operations jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_name text;
  v_festival public.festivals%rowtype;
  v_event_id bigint;
  v_operation jsonb;
  v_operation_type text;
  v_lineup public.festival_artists%rowtype;
  v_artist public.artists%rowtype;
  v_before jsonb;
  v_after jsonb;
  v_alias text;
begin
  if not public.is_admin() then
    raise exception '관리자 권한이 필요합니다.' using errcode = '42501';
  end if;

  if p_work_type not in ('announcement', 'correction') then
    raise exception '작업 종류는 발표 또는 정정이어야 합니다.' using errcode = '22023';
  end if;

  if p_lineup_round not in ('unspecified', 'first', 'second', 'third', 'final') then
    raise exception '올바른 라인업 차수를 선택해 주세요.' using errcode = '22023';
  end if;

  if p_work_type = 'announcement'
     and (p_announcement_date is null or nullif(pg_catalog.btrim(p_source_url), '') is null) then
    raise exception '라인업 발표는 공식 발표일과 출처가 모두 필요합니다.' using errcode = '22023';
  end if;

  if p_work_type = 'correction'
     and nullif(pg_catalog.btrim(p_source_url), '') is null
     and nullif(pg_catalog.btrim(p_reason), '') is null then
    raise exception '라인업 정정은 출처 또는 정정 사유가 필요합니다.' using errcode = '22023';
  end if;

  if pg_catalog.jsonb_typeof(p_operations) <> 'array'
     or pg_catalog.jsonb_array_length(p_operations) = 0 then
    raise exception '저장할 라인업 변경이 없습니다.' using errcode = '22023';
  end if;

  select * into v_festival
  from public.festivals
  where id = p_festival_id
  for update;

  if not found then
    raise exception '라인업을 변경할 축제를 찾을 수 없습니다.' using errcode = 'P0002';
  end if;

  select coalesce(nullif(pg_catalog.btrim(display_name), ''), '관리자')
  into v_actor_name
  from public.profiles
  where id = v_actor_id;

  if v_actor_name is null then
    raise exception '관리자 프로필의 표시 이름을 확인해 주세요.' using errcode = '22023';
  end if;

  insert into public.audit_events (
    actor_id, actor_name, action_type, festival_id, festival_name,
    work_type, lineup_round, announcement_date, source_url, reason
  ) values (
    v_actor_id, v_actor_name,
    case when p_work_type = 'announcement'
      then 'lineup.announcement' else 'lineup.correction' end,
    v_festival.id, v_festival.name, p_work_type, p_lineup_round,
    p_announcement_date, nullif(pg_catalog.btrim(p_source_url), ''),
    nullif(pg_catalog.btrim(p_reason), '')
  ) returning id into v_event_id;

  for v_operation in
    select value from pg_catalog.jsonb_array_elements(p_operations)
  loop
    v_operation_type := v_operation->>'operation';
    v_before := null;
    v_after := null;

    if nullif(v_operation->>'performance_time', '') is not null
       and nullif(v_operation->>'performance_end_time', '') is not null
       and (v_operation->>'performance_end_time')::time
         <= (v_operation->>'performance_time')::time then
      raise exception '종료 시간은 시작 시간보다 늦어야 합니다.' using errcode = '22023';
    end if;

    if v_operation_type = 'insert' then
      if nullif(v_operation->>'artist_id', '') is not null then
        select * into v_artist from public.artists
        where id = (v_operation->>'artist_id')::bigint;
        if not found then
          raise exception '추가할 아티스트를 찾을 수 없습니다.' using errcode = 'P0002';
        end if;
      else
        if nullif(pg_catalog.btrim(v_operation#>>'{new_artist,name}'), '') is null
           or (v_operation#>>'{new_artist,normalized_name}') !~ '^[a-z0-9]+$' then
          raise exception '신규 아티스트 이름과 normalized_name을 확인해 주세요.' using errcode = '22023';
        end if;

        insert into public.artists (name, normalized_name)
        values (
          pg_catalog.btrim(v_operation#>>'{new_artist,name}'),
          pg_catalog.btrim(v_operation#>>'{new_artist,normalized_name}')
        ) returning * into v_artist;

        for v_alias in
          select value #>> '{}'
          from pg_catalog.jsonb_array_elements(
            coalesce(v_operation#>'{new_artist,aliases}', '[]'::jsonb)
          )
        loop
          if nullif(pg_catalog.btrim(v_alias), '') is not null then
            insert into public.artist_aliases (artist_id, alias_name, normalized_alias)
            values (
              v_artist.id,
              pg_catalog.btrim(v_alias),
              pg_catalog.regexp_replace(pg_catalog.lower(v_alias), '[^a-z0-9가-힣]', '', 'g')
            ) on conflict do nothing;
          end if;
        end loop;
      end if;

      insert into public.festival_artists (
        festival_id, artist_id, performance_date, performance_time,
        performance_end_time, stage_name, status
      ) values (
        p_festival_id, v_artist.id,
        nullif(v_operation->>'performance_date', '')::date,
        nullif(v_operation->>'performance_time', '')::time,
        nullif(v_operation->>'performance_end_time', '')::time,
        nullif(pg_catalog.btrim(v_operation->>'stage_name'), ''),
        coalesce(nullif(v_operation->>'status', ''), 'confirmed')
      ) returning * into v_lineup;

      v_after := pg_catalog.jsonb_build_object(
        'lineup_id', v_lineup.id, 'artist_id', v_artist.id,
        'artist_name', v_artist.name, 'artist_normalized_name', v_artist.normalized_name,
        'performance_date', v_lineup.performance_date,
        'performance_time', v_lineup.performance_time,
        'performance_end_time', v_lineup.performance_end_time,
        'stage_name', v_lineup.stage_name, 'status', v_lineup.status
      );

    elsif v_operation_type in ('update', 'delete') then
      select fa.* into v_lineup
      from public.festival_artists fa
      where fa.id = (v_operation->>'lineup_id')::bigint
        and fa.festival_id = p_festival_id
      for update;

      if not found then
        raise exception '수정하거나 삭제할 라인업을 찾을 수 없습니다.' using errcode = 'P0002';
      end if;

      select * into v_artist
      from public.artists
      where id = v_lineup.artist_id;

      v_before := pg_catalog.jsonb_build_object(
        'lineup_id', v_lineup.id, 'artist_id', v_artist.id,
        'artist_name', v_artist.name, 'artist_normalized_name', v_artist.normalized_name,
        'performance_date', v_lineup.performance_date,
        'performance_time', v_lineup.performance_time,
        'performance_end_time', v_lineup.performance_end_time,
        'stage_name', v_lineup.stage_name, 'status', v_lineup.status
      );

      if v_operation_type = 'update' then
        update public.festival_artists
        set
          performance_date = nullif(v_operation->>'performance_date', '')::date,
          performance_time = nullif(v_operation->>'performance_time', '')::time,
          performance_end_time = nullif(v_operation->>'performance_end_time', '')::time,
          stage_name = nullif(pg_catalog.btrim(v_operation->>'stage_name'), ''),
          status = coalesce(nullif(v_operation->>'status', ''), 'confirmed')
        where id = v_lineup.id
        returning * into v_lineup;

        v_after := pg_catalog.jsonb_build_object(
          'lineup_id', v_lineup.id, 'artist_id', v_artist.id,
          'artist_name', v_artist.name, 'artist_normalized_name', v_artist.normalized_name,
          'performance_date', v_lineup.performance_date,
          'performance_time', v_lineup.performance_time,
          'performance_end_time', v_lineup.performance_end_time,
          'stage_name', v_lineup.stage_name, 'status', v_lineup.status
        );
      else
        delete from public.festival_artists where id = v_lineup.id;
      end if;
    else
      raise exception '지원하지 않는 라인업 작업입니다: %', v_operation_type using errcode = '22023';
    end if;

    insert into public.audit_changes (
      event_id, entity_type, entity_id, entity_label,
      operation, before_data, after_data
    ) values (
      v_event_id, 'festival_artist',
      coalesce((v_after->>'lineup_id'), (v_before->>'lineup_id')),
      coalesce(v_after->>'artist_name', v_before->>'artist_name'),
      v_operation_type, v_before, v_after
    );
  end loop;

  return v_event_id;
end;
$$;

revoke all on function public.apply_lineup_work_with_audit(
  bigint, text, text, date, text, text, jsonb
) from public, anon;
grant execute on function public.apply_lineup_work_with_audit(
  bigint, text, text, date, text, text, jsonb
) to authenticated;

comment on function public.apply_lineup_work_with_audit(
  bigint, text, text, date, text, text, jsonb
) is '여러 직접 라인업 변경을 하나의 발표 또는 정정 이벤트로 원자적으로 저장';

commit;
