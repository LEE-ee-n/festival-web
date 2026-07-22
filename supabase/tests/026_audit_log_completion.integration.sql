-- 021~026 적용 후 실행한다. 마지막 ROLLBACK으로 테스트 데이터를 제거한다.
begin;

do $$
declare
  v_festival_id bigint;
  v_artist_id bigint;
  v_event_id bigint;
begin
  select id into v_festival_id from public.festivals order by id limit 1;
  select id into v_artist_id from public.artists order by id limit 1;

  if v_festival_id is not null and not exists (
    select 1 from public.audit_events
    where baseline_key = 'festival:' || v_festival_id::text
      and action_type = 'baseline.existing_data'
      and actor_name = '시스템'
      and lineup_round = 'unspecified'
      and announcement_date is null
  ) then raise exception '축제 기존 데이터 기준점이 없습니다.'; end if;

  if v_artist_id is not null and not exists (
    select 1 from public.audit_events
    where baseline_key = 'artist:' || v_artist_id::text
      and action_type = 'baseline.existing_data'
  ) then raise exception '아티스트 기존 데이터 기준점이 없습니다.'; end if;

  select id into v_event_id from public.audit_events
  where baseline_key is not null order by id limit 1;
  if v_event_id is not null and not exists (
    select 1 from public.audit_changes where event_id = v_event_id and after_data is not null
  ) then raise exception '기준점 전체 스냅샷이 없습니다.'; end if;

  if pg_catalog.has_table_privilege('anon', 'public.audit_events', 'select')
     or pg_catalog.has_table_privilege('authenticated', 'public.audit_events', 'insert')
     or pg_catalog.has_table_privilege('authenticated', 'public.audit_events', 'update')
     or pg_catalog.has_table_privilege('authenticated', 'public.audit_events', 'delete')
     or pg_catalog.has_table_privilege('authenticated', 'public.audit_changes', 'insert')
     or pg_catalog.has_table_privilege('authenticated', 'public.audit_changes', 'update')
     or pg_catalog.has_table_privilege('authenticated', 'public.audit_changes', 'delete') then
    raise exception '감사 로그 권한이 읽기 전용으로 제한되지 않았습니다.';
  end if;

  if (select count(*) from public.audit_events where baseline_key is not null)
     <> (select count(distinct baseline_key) from public.audit_events where baseline_key is not null) then
    raise exception '기준점 로그가 중복되었습니다.';
  end if;
end;
$$;

rollback;
