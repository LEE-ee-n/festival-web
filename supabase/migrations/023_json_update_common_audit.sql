begin;

alter table public.audit_events
add column if not exists source_type text,
add column if not exists source_file_name text;

create or replace function public.audit_lineup_snapshot(
  p_festival_id bigint,
  p_normalized_name text,
  p_performance_date date
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'lineup_id', fa.id,
    'artist_id', a.id,
    'artist_name', a.name,
    'artist_normalized_name', a.normalized_name,
    'aliases', coalesce((
      select pg_catalog.jsonb_agg(aa.alias_name order by aa.alias_name)
      from public.artist_aliases aa where aa.artist_id = a.id
    ), '[]'::jsonb),
    'performance_date', fa.performance_date,
    'performance_time', fa.performance_time,
    'performance_end_time', fa.performance_end_time,
    'stage_name', fa.stage_name,
    'status', fa.status
  )
  from public.festival_artists fa
  join public.artists a on a.id = fa.artist_id
  where fa.festival_id = p_festival_id
    and a.normalized_name = p_normalized_name
    and fa.performance_date is not distinct from p_performance_date
  order by fa.id
  limit 1;
$$;

create or replace function public.audit_ticket_snapshot(p_ticket_id bigint)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select pg_catalog.to_jsonb(t)
  from public.festival_ticket_rounds t
  where t.id = p_ticket_id;
$$;

revoke all on function public.audit_lineup_snapshot(bigint, text, date) from public, anon, authenticated;
revoke all on function public.audit_ticket_snapshot(bigint) from public, anon, authenticated;

create or replace function public.apply_festival_json_update_with_audit(
  p_festival_id bigint,
  p_basic_changes jsonb default '{}'::jsonb,
  p_artists jsonb default '[]'::jsonb,
  p_tickets jsonb default '[]'::jsonb,
  p_source_type text default null,
  p_source_url text default null,
  p_source_file_name text default null,
  p_work_type text default null,
  p_lineup_round text default null,
  p_announcement_date date default null,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_name text;
  v_festival public.festivals%rowtype;
  v_festival_after public.festivals%rowtype;
  v_event_id bigint;
  v_artist jsonb;
  v_lineup_before jsonb := '[]'::jsonb;
  v_before jsonb;
  v_after jsonb;
  v_ticket jsonb;
  v_ticket_id bigint;
  v_ticket_count integer := 0;
  v_change_count integer := 0;
  v_artist_result jsonb := '{}'::jsonb;
begin
  if not public.is_admin() then
    raise exception '관리자 권한이 필요합니다.' using errcode = '42501';
  end if;

  if pg_catalog.jsonb_typeof(coalesce(p_basic_changes, '{}'::jsonb)) <> 'object'
     or pg_catalog.jsonb_typeof(coalesce(p_artists, '[]'::jsonb)) <> 'array'
     or pg_catalog.jsonb_typeof(coalesce(p_tickets, '[]'::jsonb)) <> 'array' then
    raise exception '업데이트 값의 JSON 형식이 올바르지 않습니다.' using errcode = '22023';
  end if;

  if pg_catalog.jsonb_array_length(coalesce(p_artists, '[]'::jsonb)) > 0 then
    if p_work_type not in ('announcement', 'correction') then
      raise exception '라인업 변경은 발표 또는 정정으로 기록해야 합니다.' using errcode = '22023';
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
  end if;

  select * into v_festival from public.festivals
  where id = p_festival_id for update;
  if not found then
    raise exception '업데이트할 축제를 찾을 수 없습니다.' using errcode = 'P0002';
  end if;
  if v_festival.verification_status is distinct from 'approved' then
    raise exception '승인된 정식 축제만 JSON으로 업데이트할 수 있습니다.' using errcode = '22023';
  end if;

  select coalesce(nullif(pg_catalog.btrim(display_name), ''), '관리자')
  into v_actor_name from public.profiles where id = v_actor_id;
  if v_actor_name is null then
    raise exception '관리자 프로필의 표시 이름을 확인해 주세요.' using errcode = '22023';
  end if;

  insert into public.audit_events (
    actor_id, actor_name, action_type, festival_id, festival_name,
    work_type, lineup_round, announcement_date, source_url, reason,
    source_type, source_file_name
  ) values (
    v_actor_id, v_actor_name, 'festival.json_update', v_festival.id, v_festival.name,
    case when pg_catalog.jsonb_array_length(coalesce(p_artists, '[]'::jsonb)) > 0 then p_work_type end,
    case when pg_catalog.jsonb_array_length(coalesce(p_artists, '[]'::jsonb)) > 0 then p_lineup_round end,
    case when pg_catalog.jsonb_array_length(coalesce(p_artists, '[]'::jsonb)) > 0 then p_announcement_date end,
    nullif(pg_catalog.btrim(p_source_url), ''), nullif(pg_catalog.btrim(p_reason), ''),
    nullif(pg_catalog.btrim(p_source_type), ''), nullif(pg_catalog.btrim(p_source_file_name), '')
  ) returning id into v_event_id;

  if p_basic_changes <> '{}'::jsonb then
    update public.festivals set
      name = case when p_basic_changes ? 'name' then nullif(pg_catalog.btrim(p_basic_changes->>'name'), '') else name end,
      search_aliases = case when p_basic_changes ? 'search_aliases' then nullif(pg_catalog.btrim(p_basic_changes->>'search_aliases'), '') else search_aliases end,
      location = case when p_basic_changes ? 'location' then nullif(pg_catalog.btrim(p_basic_changes->>'location'), '') else location end,
      address = case when p_basic_changes ? 'address' then nullif(pg_catalog.btrim(p_basic_changes->>'address'), '') else address end,
      region = case when p_basic_changes ? 'region' then nullif(pg_catalog.btrim(p_basic_changes->>'region'), '') else region end,
      category = case when p_basic_changes ? 'category' then nullif(pg_catalog.btrim(p_basic_changes->>'category'), '') else category end,
      description = case when p_basic_changes ? 'description' then nullif(pg_catalog.btrim(p_basic_changes->>'description'), '') else description end,
      price_info = case when p_basic_changes ? 'price_info' then nullif(pg_catalog.btrim(p_basic_changes->>'price_info'), '') else price_info end,
      program_info = case when p_basic_changes ? 'program_info' then nullif(pg_catalog.btrim(p_basic_changes->>'program_info'), '') else program_info end,
      source_url = case when p_basic_changes ? 'source_url' then nullif(pg_catalog.btrim(p_basic_changes->>'source_url'), '') else source_url end,
      official_url = case when p_basic_changes ? 'official_url' then nullif(pg_catalog.btrim(p_basic_changes->>'official_url'), '') else official_url end,
      thumbnail_url = case when p_basic_changes ? 'thumbnail_url' then nullif(pg_catalog.btrim(p_basic_changes->>'thumbnail_url'), '') else thumbnail_url end,
      price_type = case when p_basic_changes ? 'price_type' then nullif(pg_catalog.btrim(p_basic_changes->>'price_type'), '') else price_type end,
      status = case when p_basic_changes ? 'status' then nullif(pg_catalog.btrim(p_basic_changes->>'status'), '') else status end
    where id = p_festival_id returning * into v_festival_after;

    if (pg_catalog.to_jsonb(v_festival) - 'updated_at')
       is distinct from (pg_catalog.to_jsonb(v_festival_after) - 'updated_at') then
      insert into public.audit_changes (
        event_id, entity_type, entity_id, entity_label, operation, before_data, after_data
      ) values (
        v_event_id, 'festival', v_festival.id::text, v_festival_after.name,
        'update', pg_catalog.to_jsonb(v_festival), pg_catalog.to_jsonb(v_festival_after)
      );
      v_change_count := v_change_count + 1;
    end if;
  end if;

  for v_artist in select value from pg_catalog.jsonb_array_elements(coalesce(p_artists, '[]'::jsonb))
  loop
    v_lineup_before := v_lineup_before || pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object(
        'normalized_name', v_artist->>'normalized_name',
        'performance_date', v_artist->>'performance_date',
        'snapshot', public.audit_lineup_snapshot(
          p_festival_id,
          v_artist->>'normalized_name',
          nullif(v_artist->>'performance_date', '')::date
        )
      )
    );
  end loop;

  if pg_catalog.jsonb_array_length(coalesce(p_artists, '[]'::jsonb)) > 0 then
    v_artist_result := public.import_festival_lineup(p_festival_id, p_artists);

    for v_artist in select value from pg_catalog.jsonb_array_elements(v_lineup_before)
    loop
      v_before := v_artist->'snapshot';
      if v_before = 'null'::jsonb then v_before := null; end if;
      v_after := public.audit_lineup_snapshot(
        p_festival_id,
        v_artist->>'normalized_name',
        nullif(v_artist->>'performance_date', '')::date
      );

      if v_before is distinct from v_after then
        insert into public.audit_changes (
          event_id, entity_type, entity_id, entity_label, operation, before_data, after_data
        ) values (
          v_event_id, 'festival_artist',
          coalesce(v_after->>'lineup_id', v_before->>'lineup_id'),
          coalesce(v_after->>'artist_name', v_before->>'artist_name', v_artist->>'normalized_name'),
          case when v_before is null then 'insert' else 'update' end,
          v_before, v_after
        );
        v_change_count := v_change_count + 1;
      end if;
    end loop;
  end if;

  for v_ticket in select value from pg_catalog.jsonb_array_elements(coalesce(p_tickets, '[]'::jsonb))
  loop
    v_ticket_id := nullif(v_ticket->>'existing_ticket_id', '')::bigint;
    v_before := case when v_ticket_id is null then null else public.audit_ticket_snapshot(v_ticket_id) end;

    if v_ticket_id is not null then
      update public.festival_ticket_rounds set
        round_type = nullif(pg_catalog.btrim(v_ticket->>'round_type'), ''),
        round_name = coalesce(nullif(pg_catalog.btrim(v_ticket->>'round_name'), ''), round_name),
        open_at = nullif(v_ticket->>'open_at', '')::timestamptz,
        price_info = nullif(pg_catalog.btrim(v_ticket->>'price_info'), ''),
        ticket_url = nullif(pg_catalog.btrim(v_ticket->>'ticket_url'), ''),
        ticket_platform = nullif(pg_catalog.btrim(v_ticket->>'ticket_platform'), '')
      where id = v_ticket_id and festival_id = p_festival_id;
      if not found then raise exception '수정할 티켓을 찾을 수 없습니다.' using errcode = 'P0002'; end if;
    else
      insert into public.festival_ticket_rounds (
        festival_id, round_type, round_name, open_at, price_info, ticket_url, ticket_platform
      ) values (
        p_festival_id, nullif(pg_catalog.btrim(v_ticket->>'round_type'), ''),
        coalesce(nullif(pg_catalog.btrim(v_ticket->>'round_name'), ''), '일반 예매'),
        nullif(v_ticket->>'open_at', '')::timestamptz,
        nullif(pg_catalog.btrim(v_ticket->>'price_info'), ''),
        nullif(pg_catalog.btrim(v_ticket->>'ticket_url'), ''),
        nullif(pg_catalog.btrim(v_ticket->>'ticket_platform'), '')
      ) returning id into v_ticket_id;
    end if;

    v_after := public.audit_ticket_snapshot(v_ticket_id);
    if v_before is distinct from v_after then
      insert into public.audit_changes (
        event_id, entity_type, entity_id, entity_label, operation, before_data, after_data
      ) values (
        v_event_id, 'festival_ticket_round', v_ticket_id::text,
        coalesce(v_after->>'round_name', v_before->>'round_name', '티켓'),
        case when v_before is null then 'insert' else 'update' end,
        v_before, v_after
      );
      v_change_count := v_change_count + 1;
    end if;
    v_ticket_count := v_ticket_count + 1;
  end loop;

  if v_change_count = 0 then
    raise exception 'DB에서 실제로 변경된 값이 없습니다.' using errcode = '22023';
  end if;

  return pg_catalog.jsonb_build_object(
    'festival_id', p_festival_id, 'audit_event_id', v_event_id,
    'change_count', v_change_count, 'ticket_count', v_ticket_count,
    'artist_result', v_artist_result
  );
end;
$$;

revoke all on function public.apply_festival_json_update_with_audit(
  bigint, jsonb, jsonb, jsonb, text, text, text, text, text, date, text
) from public, anon;
grant execute on function public.apply_festival_json_update_with_audit(
  bigint, jsonb, jsonb, jsonb, text, text, text, text, text, date, text
) to authenticated;

comment on function public.apply_festival_json_update_with_audit(
  bigint, jsonb, jsonb, jsonb, text, text, text, text, text, date, text
) is '선택된 JSON 변경의 실제 DB 전후 상태를 하나의 공통 감사 이벤트로 원자적으로 기록';

commit;
