-- 021~025 마이그레이션 적용 후 검증용 DB에서 실행한다.
-- 마지막 ROLLBACK으로 모든 테스트 데이터를 제거한다.
begin;

do $$
declare
  v_admin_id uuid;
  v_artist_id bigint;
  v_other_id bigint;
  v_festival_id bigint;
  v_result jsonb;
  v_event_id bigint;
  v_before_events integer;
  v_suffix text := pg_catalog.txid_current()::text;
begin
  select id into v_admin_id from public.profiles where role = 'admin' order by created_at limit 1;
  if v_admin_id is null then raise exception '통합 테스트용 관리자 계정이 필요합니다.'; end if;
  perform pg_catalog.set_config('request.jwt.claim.sub', v_admin_id::text, true);

  v_result := public.create_artist_with_audit(
    '감사 테스트 아티스트', 'artistaudittest' || v_suffix, array['테스트 별칭']
  );
  v_artist_id := (v_result->>'id')::bigint;
  select id into v_event_id from public.audit_events
  where action_type = 'artist.created' and target_id = v_artist_id::text order by id desc limit 1;

  if (select count(*) from public.audit_changes where event_id = v_event_id) <> 2 then
    raise exception '아티스트 생성과 별칭 추가가 같은 작업에 묶이지 않았습니다.';
  end if;

  perform public.update_artist_admin(
    v_artist_id, '변경된 표시 이름', 'artistupdated' || v_suffix,
    array['수정 별칭', '추가 별칭']
  );
  select id into v_event_id from public.audit_events
  where action_type = 'artist.updated' and target_id = v_artist_id::text order by id desc limit 1;

  if not exists (
    select 1 from public.audit_changes where event_id = v_event_id and entity_type = 'artist'
      and before_data->>'name' = '감사 테스트 아티스트'
      and after_data->>'name' = '변경된 표시 이름'
  ) or not exists (
    select 1 from public.audit_changes where event_id = v_event_id and entity_type = 'artist_alias'
  ) then raise exception '아티스트 수정과 별칭 전후 기록이 없습니다.'; end if;

  v_result := public.create_artist_with_audit(
    '중복 검사 아티스트', 'artistduplicate' || v_suffix, array['중복 별칭']
  );
  v_other_id := (v_result->>'id')::bigint;
  select count(*) into v_before_events from public.audit_events;
  begin
    perform public.update_artist_admin(
      v_artist_id, '실패 이름', 'artistduplicate' || v_suffix, array['중복 별칭']
    );
    raise exception '중복 작업이 성공했습니다.';
  exception when unique_violation then null;
  end;
  if (select name from public.artists where id = v_artist_id) <> '변경된 표시 이름'
     or (select count(*) from public.audit_events) <> v_before_events then
    raise exception '중복 실패 후 데이터나 감사 로그가 남았습니다.';
  end if;

  begin
    perform public.update_artist_admin(
      v_artist_id, '별칭 실패 이름', 'artistaliasfailure' || v_suffix, array['중복 별칭']
    );
    raise exception '중복 별칭 작업이 성공했습니다.';
  exception when unique_violation then null;
  end;
  if (select name from public.artists where id = v_artist_id) <> '변경된 표시 이름'
     or (select count(*) from public.audit_events) <> v_before_events then
    raise exception '중복 별칭 실패 후 데이터나 감사 로그가 남았습니다.';
  end if;

  v_festival_id := public.create_festival_with_audit(pg_catalog.jsonb_build_object(
    'name', '신규 아티스트 라인업 테스트', 'normalized_name', 'newartistlineup' || v_suffix,
    'start_date', '2099-05-01', 'end_date', '2099-05-02',
    'status', 'scheduled', 'verification_status', 'pending'
  ));
  v_event_id := public.apply_lineup_work_with_audit(
    v_festival_id, 'announcement', 'first', '2099-01-01', 'https://example.com/lineup', null,
    pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object(
      'operation', 'insert',
      'new_artist', pg_catalog.jsonb_build_object(
        'name', '라인업 신규 아티스트', 'normalized_name', 'lineupnewartist' || v_suffix,
        'aliases', pg_catalog.jsonb_build_array('라인업 별칭')
      ),
      'performance_date', '2099-05-01', 'status', 'confirmed'
    ))
  );
  if not exists (select 1 from public.audit_changes where event_id = v_event_id and entity_type = 'artist')
     or not exists (select 1 from public.audit_changes where event_id = v_event_id and entity_type = 'festival_artist') then
    raise exception '신규 아티스트 생성과 라인업 연결이 같은 작업에 묶이지 않았습니다.';
  end if;

  if not exists (
    select 1 from public.audit_events where target_id = v_artist_id::text
      and target_label = '감사 테스트 아티스트'
  ) then raise exception '과거 대상 표시 이름 스냅샷이 유지되지 않았습니다.'; end if;

  perform pg_catalog.set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000000', true);
  begin
    perform public.create_artist_with_audit('권한 실패', 'permissionfailure' || v_suffix, '{}');
    raise exception '일반 사용자의 아티스트 생성이 성공했습니다.';
  exception when insufficient_privilege then null;
  end;
end;
$$;

rollback;
