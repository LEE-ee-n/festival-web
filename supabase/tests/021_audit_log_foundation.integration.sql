-- 로컬/검증용 Supabase DB에서 021 마이그레이션 적용 후 실행한다.
-- 모든 테스트 데이터는 마지막 ROLLBACK으로 제거된다.
begin;

do $$
declare
  v_admin_id uuid;
  v_festival_id bigint;
  v_normalized_name text := 'auditlogtest' || pg_catalog.txid_current()::text;
  v_event_count integer;
  v_change_count integer;
begin
  select id into v_admin_id
  from public.profiles
  where role = 'admin'
  order by created_at
  limit 1;

  if v_admin_id is null then
    raise exception '통합 테스트에 사용할 profiles.role=admin 계정이 필요합니다.';
  end if;

  perform pg_catalog.set_config('request.jwt.claim.sub', v_admin_id::text, true);

  v_festival_id := public.create_festival_with_audit(pg_catalog.jsonb_build_object(
    'name', '감사 로그 통합 테스트',
    'normalized_name', v_normalized_name,
    'start_date', '2099-01-01',
    'end_date', '2099-01-02',
    'status', 'scheduled',
    'verification_status', 'pending'
  ));

  perform public.update_festival_basic_info_with_audit(
    v_festival_id,
    pg_catalog.jsonb_build_object(
      'name', '감사 로그 통합 테스트 수정',
      'normalized_name', v_normalized_name,
      'start_date', '2099-01-01',
      'end_date', '2099-01-02',
      'status', 'scheduled',
      'verification_status', 'pending'
    )
  );

  perform public.delete_festival_with_audit(v_festival_id);

  select count(*) into v_event_count
  from public.audit_events
  where festival_name in ('감사 로그 통합 테스트', '감사 로그 통합 테스트 수정')
    and actor_id = v_admin_id;

  select count(*) into v_change_count
  from public.audit_changes
  where entity_type = 'festival'
    and entity_id = v_festival_id::text;

  if v_event_count <> 3 or v_change_count <> 3 then
    raise exception '등록·수정·삭제 로그가 모두 기록되지 않았습니다: events %, changes %',
      v_event_count, v_change_count;
  end if;

  if not exists (
    select 1 from public.audit_changes
    where entity_id = v_festival_id::text
      and operation = 'delete'
      and before_data->>'name' = '감사 로그 통합 테스트 수정'
      and after_data is null
  ) then
    raise exception '삭제 후에도 남아야 할 변경 전 스냅샷이 없습니다.';
  end if;

  if pg_catalog.has_table_privilege('anon', 'public.audit_events', 'select')
     or pg_catalog.has_table_privilege('anon', 'public.audit_changes', 'select')
     or pg_catalog.has_table_privilege('authenticated', 'public.audit_events', 'insert')
     or pg_catalog.has_table_privilege('authenticated', 'public.audit_changes', 'insert')
     or pg_catalog.has_table_privilege('authenticated', 'public.audit_events', 'update')
     or pg_catalog.has_table_privilege('authenticated', 'public.audit_changes', 'delete') then
    raise exception '감사 로그 권한이 읽기 전용 정책과 일치하지 않습니다.';
  end if;
end;
$$;

rollback;
