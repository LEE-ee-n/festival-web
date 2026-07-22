begin;

-- 기존 데이터 기준점은 재실행해도 중복 생성되지 않는다.
alter table public.audit_events
add column if not exists baseline_key text;

create unique index if not exists audit_events_baseline_key_unique
on public.audit_events (baseline_key)
where baseline_key is not null;

with festival_events as (
  insert into public.audit_events (
    actor_id, actor_name, action_type, festival_id, festival_name,
    lineup_round, target_type, target_id, target_label, baseline_key
  )
  select
    null, '시스템', 'baseline.existing_data', f.id, f.name,
    'unspecified', 'festival', f.id::text, f.name, 'festival:' || f.id::text
  from public.festivals f
  on conflict (baseline_key) where baseline_key is not null do nothing
  returning id, festival_id
), festival_snapshots as (
  insert into public.audit_changes (
    event_id, entity_type, entity_id, entity_label, operation, before_data, after_data
  )
  select e.id, 'festival', f.id::text, f.name, 'insert', null, pg_catalog.to_jsonb(f)
  from festival_events e
  join public.festivals f on f.id = e.festival_id
), lineup_snapshots as (
  insert into public.audit_changes (
    event_id, entity_type, entity_id, entity_label, operation, before_data, after_data
  )
  select e.id, 'festival_artist', fa.id::text, a.name, 'insert', null,
    pg_catalog.jsonb_build_object(
      'lineup_id', fa.id, 'artist_id', a.id, 'artist_name', a.name,
      'artist_normalized_name', a.normalized_name,
      'performance_date', fa.performance_date,
      'performance_time', fa.performance_time,
      'performance_end_time', fa.performance_end_time,
      'stage_name', fa.stage_name, 'status', fa.status
    )
  from festival_events e
  join public.festival_artists fa on fa.festival_id = e.festival_id
  join public.artists a on a.id = fa.artist_id
)
insert into public.audit_changes (
  event_id, entity_type, entity_id, entity_label, operation, before_data, after_data
)
select e.id, 'festival_ticket_round', t.id::text, t.round_name, 'insert', null,
       pg_catalog.to_jsonb(t)
from festival_events e
join public.festival_ticket_rounds t on t.festival_id = e.festival_id;

with artist_events as (
  insert into public.audit_events (
    actor_id, actor_name, action_type, festival_name,
    target_type, target_id, target_label, baseline_key
  )
  select
    null, '시스템', 'baseline.existing_data', null,
    'artist', a.id::text, a.name, 'artist:' || a.id::text
  from public.artists a
  on conflict (baseline_key) where baseline_key is not null do nothing
  returning id, target_id
), artist_snapshots as (
  insert into public.audit_changes (
    event_id, entity_type, entity_id, entity_label, operation, before_data, after_data
  )
  select e.id, 'artist', a.id::text, a.name, 'insert', null, pg_catalog.to_jsonb(a)
  from artist_events e
  join public.artists a on a.id::text = e.target_id
)
insert into public.audit_changes (
  event_id, entity_type, entity_id, entity_label, operation, before_data, after_data
)
select e.id, 'artist_alias', aa.id::text, a.name, 'insert', null, pg_catalog.to_jsonb(aa)
from artist_events e
join public.artists a on a.id::text = e.target_id
join public.artist_aliases aa on aa.artist_id = a.id;

-- 감사 자료는 클라이언트에서 읽기만 가능하며 수정·삭제 권한은 주지 않는다.
revoke insert, update, delete, truncate on table public.audit_events from public, anon, authenticated;
revoke insert, update, delete, truncate on table public.audit_changes from public, anon, authenticated;

comment on column public.audit_events.baseline_key is
'기존 데이터 기준점의 중복 생성을 막는 내부 식별자';
comment on table public.audit_events is
'관리자 작업 단위와 작업 당시의 작업자·대상 표시 이름을 영구 보관';
comment on table public.audit_changes is
'감사 이벤트에 포함된 대상별 변경 전후 전체 스냅샷을 영구 보관';

commit;
