begin;

create or replace function public.approve_new_festival_candidate(
  p_candidate_id bigint,
  p_draft jsonb,
  p_review_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_candidate public.festival_candidates%rowtype;
  v_festival public.festivals%rowtype;
  v_normalized_name text;
  v_start_date date;
  v_end_date date;
  v_artists jsonb;
  v_tickets jsonb;
  v_lineup_result jsonb := pg_catalog.jsonb_build_object(
    'new_artist_count', 0, 'existing_artist_count', 0,
    'linked_count', 0, 'already_linked_count', 0, 'alias_count', 0
  );
  v_ticket jsonb;
  v_ticket_row public.festival_ticket_rounds%rowtype;
  v_ticket_count integer := 0;
  v_event_id bigint;
begin
  if not public.is_admin() then
    raise exception '관리자 권한이 필요합니다.' using errcode = '42501';
  end if;

  select * into v_candidate
  from public.festival_candidates
  where id = p_candidate_id
  for update;
  if not found then raise exception '검토 후보를 찾을 수 없습니다.' using errcode = 'P0002'; end if;
  if v_candidate.work_type <> 'new' then raise exception '신규 축제 작업만 승인할 수 있습니다.' using errcode = '22023'; end if;
  if v_candidate.status <> 'pending' then raise exception '검토 대기 상태의 작업만 승인할 수 있습니다.' using errcode = '22023'; end if;

  if p_draft is null
     or pg_catalog.jsonb_typeof(p_draft) <> 'object'
     or pg_catalog.jsonb_typeof(p_draft->'festival') <> 'object'
     or pg_catalog.jsonb_typeof(p_draft->'artists') <> 'array'
     or (p_draft ? 'tickets' and pg_catalog.jsonb_typeof(p_draft->'tickets') <> 'array') then
    raise exception '등록 가능한 축제 JSON 형식이 아닙니다.' using errcode = '22023';
  end if;

  v_normalized_name := nullif(pg_catalog.btrim(p_draft->'festival'->>'normalized_name'), '');
  v_start_date := nullif(p_draft->'festival'->>'start_date', '')::date;
  v_end_date := nullif(p_draft->'festival'->>'end_date', '')::date;
  v_artists := coalesce(p_draft->'artists', '[]'::jsonb);
  v_tickets := coalesce(p_draft->'tickets', '[]'::jsonb);

  if v_normalized_name is null or v_normalized_name !~ '^[a-z0-9]+$' then
    raise exception '올바른 festival.normalized_name이 필요합니다.' using errcode = '22023';
  end if;
  if v_start_date is null or v_end_date is null or v_end_date < v_start_date then
    raise exception '올바른 축제 시작일과 종료일이 필요합니다.' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_normalized_name || '|' || v_start_date::text || '|' || v_end_date::text, 0)
  );
  if exists (
    select 1 from public.festivals
    where normalized_name = v_normalized_name
      and start_date = v_start_date
      and end_date = v_end_date
  ) then
    raise exception '이미 등록된 축제입니다. 페스티벌 관리에서 처리해 주세요.' using errcode = '23505';
  end if;

  insert into public.festivals (
    name, normalized_name, search_aliases, start_date, end_date,
    location, address, region, category, description, price_info,
    program_info, source_url, official_url, thumbnail_url, price_type,
    status, verification_status
  ) values (
    nullif(pg_catalog.btrim(p_draft->'festival'->>'name'), ''),
    v_normalized_name,
    nullif(pg_catalog.btrim(p_draft->'festival'->>'search_aliases'), ''),
    v_start_date, v_end_date,
    nullif(pg_catalog.btrim(p_draft->'festival'->>'location'), ''),
    nullif(pg_catalog.btrim(p_draft->'festival'->>'address'), ''),
    nullif(pg_catalog.btrim(p_draft->'festival'->>'region'), ''),
    nullif(pg_catalog.btrim(p_draft->'festival'->>'category'), ''),
    nullif(pg_catalog.btrim(p_draft->'festival'->>'description'), ''),
    nullif(pg_catalog.btrim(p_draft->'festival'->>'price_info'), ''),
    nullif(pg_catalog.btrim(p_draft->'festival'->>'program_info'), ''),
    coalesce(nullif(pg_catalog.btrim(p_draft->'festival'->>'source_url'), ''), v_candidate.source_url),
    nullif(pg_catalog.btrim(p_draft->'festival'->>'official_url'), ''),
    nullif(pg_catalog.btrim(p_draft->'festival'->>'thumbnail_url'), ''),
    nullif(pg_catalog.btrim(p_draft->'festival'->>'price_type'), ''),
    coalesce(nullif(pg_catalog.btrim(p_draft->'festival'->>'status'), ''), 'scheduled'),
    'approved'
  ) returning * into v_festival;

  insert into public.audit_events (
    actor_id, actor_name, action_type, festival_id, festival_name,
    source_type, source_url, source_file_name, note,
    target_type, target_id, target_label
  ) values (
    auth.uid(), public.audit_actor_name(), 'festival.candidate_approved',
    v_festival.id, v_festival.name, 'festival_candidate',
    coalesce(v_candidate.source_url, p_draft->'candidate'->>'source_url'),
    'festival-draft.json', nullif(pg_catalog.btrim(p_review_notes), ''),
    'festival', v_festival.id::text, v_festival.name
  ) returning id into v_event_id;

  insert into public.audit_changes (
    event_id, entity_type, entity_id, entity_label, operation, before_data, after_data
  ) values (
    v_event_id, 'festival', v_festival.id::text, v_festival.name,
    'insert', null, pg_catalog.to_jsonb(v_festival)
  );

  if pg_catalog.jsonb_array_length(v_artists) > 0 then
    v_lineup_result := public.import_festival_lineup(v_festival.id, v_artists);
    insert into public.audit_changes (
      event_id, entity_type, entity_id, entity_label, operation, before_data, after_data
    )
    select v_event_id, 'festival_artist', fa.id::text, a.name, 'insert', null,
      pg_catalog.jsonb_build_object(
        'lineup_id', fa.id, 'artist_id', fa.artist_id, 'artist_name', a.name,
        'artist_normalized_name', a.normalized_name,
        'performance_date', fa.performance_date,
        'performance_time', fa.performance_time,
        'performance_end_time', fa.performance_end_time,
        'stage_name', fa.stage_name, 'status', fa.status
      )
    from public.festival_artists fa
    join public.artists a on a.id = fa.artist_id
    where fa.festival_id = v_festival.id;
  end if;

  for v_ticket in select value from pg_catalog.jsonb_array_elements(v_tickets)
  loop
    insert into public.festival_ticket_rounds (
      festival_id, round_type, round_name, open_at, price_info, ticket_url, ticket_platform
    ) values (
      v_festival.id,
      nullif(pg_catalog.btrim(v_ticket->>'round_type'), ''),
      coalesce(nullif(pg_catalog.btrim(v_ticket->>'round_name'), ''), '일반 예매'),
      nullif(v_ticket->>'open_at', '')::timestamptz,
      nullif(pg_catalog.btrim(v_ticket->>'price_info'), ''),
      nullif(pg_catalog.btrim(v_ticket->>'ticket_url'), ''),
      nullif(pg_catalog.btrim(v_ticket->>'ticket_platform'), '')
    ) returning * into v_ticket_row;

    insert into public.audit_changes (
      event_id, entity_type, entity_id, entity_label, operation, before_data, after_data
    ) values (
      v_event_id, 'festival_ticket_round', v_ticket_row.id::text,
      v_ticket_row.round_name, 'insert', null, pg_catalog.to_jsonb(v_ticket_row)
    );
    v_ticket_count := v_ticket_count + 1;
  end loop;

  update public.audit_events
  set audit_summary = pg_catalog.jsonb_build_object(
    'festival', 1,
    'lineup', pg_catalog.jsonb_array_length(v_artists),
    'ticket', v_ticket_count
  )
  where id = v_event_id;

  update public.festival_candidates
  set draft_json = p_draft,
      festival_name = v_festival.name,
      start_date = v_start_date,
      end_date = v_end_date,
      location = v_festival.location,
      category = v_festival.category,
      status = 'approved',
      reject_reason = null,
      review_notes = nullif(pg_catalog.btrim(p_review_notes), ''),
      reviewed_at = pg_catalog.now(),
      reviewed_by = auth.uid(),
      festival_id = v_festival.id,
      updated_at = pg_catalog.now()
  where id = p_candidate_id;

  return pg_catalog.jsonb_build_object(
    'festival_id', v_festival.id,
    'audit_event_id', v_event_id,
    'import_result', v_lineup_result || pg_catalog.jsonb_build_object('ticket_count', v_ticket_count)
  );
end;
$$;

revoke all on function public.approve_new_festival_candidate(bigint, jsonb, text) from public, anon;
grant execute on function public.approve_new_festival_candidate(bigint, jsonb, text) to authenticated;

drop function if exists public.approve_festival_candidate(bigint, jsonb, text);
drop function if exists public.import_festival_json(jsonb, jsonb, jsonb);
drop function if exists public.apply_festival_json_update(bigint, jsonb, jsonb, jsonb, jsonb, text, text, text);

insert into public.audit_events (
  actor_id, actor_name, action_type, festival_id, festival_name,
  source_type, source_url, source_file_name, created_at,
  target_type, target_id, target_label, baseline_key, audit_summary
)
select l.updated_by,
  coalesce(nullif(pg_catalog.btrim(p.display_name), ''), '이전 관리자'),
  'legacy.festival_json_update', l.festival_id, f.name,
  l.source_type, l.source_url, l.source_file_name,
  coalesce(l.created_at, pg_catalog.now()),
  'festival', l.festival_id::text, f.name,
  'legacy.festival_update_logs:' || l.id::text,
  pg_catalog.jsonb_build_object('legacy_changes', coalesce(l.changes, '[]'::jsonb))
from public.festival_update_logs l
join public.festivals f on f.id = l.festival_id
left join public.profiles p on p.id = l.updated_by
where not exists (
  select 1 from public.audit_events e
  where e.baseline_key = 'legacy.festival_update_logs:' || l.id::text
);

insert into public.audit_changes (
  event_id, entity_type, entity_id, entity_label,
  operation, before_data, after_data, created_at
)
select e.id, 'legacy_json_update', l.id::text, f.name,
  'insert', null, coalesce(l.changes, '[]'::jsonb),
  coalesce(l.created_at, e.created_at, pg_catalog.now())
from public.festival_update_logs l
join public.festivals f on f.id = l.festival_id
join public.audit_events e
  on e.baseline_key = 'legacy.festival_update_logs:' || l.id::text
where not exists (
  select 1 from public.audit_changes c
  where c.event_id = e.id and c.entity_type = 'legacy_json_update'
);

insert into public.audit_events (
  actor_id, actor_name, action_type, festival_id, festival_name,
  created_at, target_type, target_id, target_label, baseline_key, audit_summary
)
select null, '시스템', 'baseline.current_state', f.id, f.name,
  pg_catalog.now(), 'festival', f.id::text, f.name,
  'baseline.current_state.034.festival:' || f.id::text,
  pg_catalog.jsonb_build_object(
    'recorded_at', pg_catalog.now(),
    'reason', '정확한 변경 시각이 없는 기존 데이터의 현재 상태 기준점'
  )
from public.festivals f
where not exists (
  select 1 from public.audit_events e
  where e.baseline_key = 'baseline.current_state.034.festival:' || f.id::text
);

insert into public.audit_changes (
  event_id, entity_type, entity_id, entity_label, operation, before_data, after_data
)
select e.id, 'festival', f.id::text, f.name, 'insert', null, pg_catalog.to_jsonb(f)
from public.festivals f
join public.audit_events e
  on e.baseline_key = 'baseline.current_state.034.festival:' || f.id::text
where not exists (
  select 1 from public.audit_changes c
  where c.event_id = e.id and c.entity_type = 'festival' and c.entity_id = f.id::text
);

insert into public.audit_changes (
  event_id, entity_type, entity_id, entity_label, operation, before_data, after_data
)
select e.id, 'festival_artist', fa.id::text, a.name, 'insert', null,
  pg_catalog.jsonb_build_object(
    'lineup_id', fa.id, 'artist_id', fa.artist_id, 'artist_name', a.name,
    'artist_normalized_name', a.normalized_name,
    'performance_date', fa.performance_date,
    'performance_time', fa.performance_time,
    'performance_end_time', fa.performance_end_time,
    'stage_name', fa.stage_name, 'status', fa.status
  )
from public.festival_artists fa
join public.artists a on a.id = fa.artist_id
join public.audit_events e
  on e.baseline_key = 'baseline.current_state.034.festival:' || fa.festival_id::text
where not exists (
  select 1 from public.audit_changes c
  where c.event_id = e.id and c.entity_type = 'festival_artist' and c.entity_id = fa.id::text
);

insert into public.audit_changes (
  event_id, entity_type, entity_id, entity_label, operation, before_data, after_data
)
select e.id, 'festival_ticket_round', t.id::text, t.round_name, 'insert', null,
  pg_catalog.to_jsonb(t)
from public.festival_ticket_rounds t
join public.audit_events e
  on e.baseline_key = 'baseline.current_state.034.festival:' || t.festival_id::text
where not exists (
  select 1 from public.audit_changes c
  where c.event_id = e.id and c.entity_type = 'festival_ticket_round' and c.entity_id = t.id::text
);

drop table if exists public.festival_update_logs;

comment on function public.approve_new_festival_candidate(bigint, jsonb, text) is
  'Approves a new-only candidate and records festival, lineup, ticket, artist, and alias changes in one audit event.';

commit;
