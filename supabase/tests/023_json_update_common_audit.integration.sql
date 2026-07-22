-- 021~023 마이그레이션 적용 후 검증용 DB에서 실행한다.
-- 마지막 ROLLBACK으로 모든 테스트 데이터를 제거한다.
begin;

do $$
declare
  v_admin_id uuid;
  v_festival_id bigint;
  v_artist_id bigint;
  v_lineup_id bigint;
  v_ticket_id bigint;
  v_result jsonb;
  v_event_id bigint;
  v_legacy_count integer;
  v_event_count integer;
  v_suffix text := pg_catalog.txid_current()::text;
begin
  select id into v_admin_id from public.profiles
  where role = 'admin' order by created_at limit 1;
  if v_admin_id is null then raise exception '통합 테스트용 관리자 계정이 필요합니다.'; end if;
  perform pg_catalog.set_config('request.jwt.claim.sub', v_admin_id::text, true);

  v_festival_id := public.create_festival_with_audit(pg_catalog.jsonb_build_object(
    'name', 'JSON 감사 테스트', 'normalized_name', 'jsonaudittest' || v_suffix,
    'start_date', '2099-03-01', 'end_date', '2099-03-02',
    'status', 'scheduled', 'verification_status', 'approved'
  ));
  insert into public.artists (name, normalized_name)
  values ('JSON 테스트 아티스트', 'jsonartist' || v_suffix) returning id into v_artist_id;
  insert into public.festival_artists (
    festival_id, artist_id, performance_date, stage_name, status
  ) values (
    v_festival_id, v_artist_id, '2099-03-01', 'OLD', 'confirmed'
  ) returning id into v_lineup_id;
  insert into public.festival_ticket_rounds (
    festival_id, round_name, price_info
  ) values (
    v_festival_id, '일반 예매', '100원'
  ) returning id into v_ticket_id;

  select count(*) into v_legacy_count
  from public.festival_update_logs where festival_id = v_festival_id;

  v_result := public.apply_festival_json_update_with_audit(
    p_festival_id => v_festival_id,
    p_basic_changes => '{"location":"NEW PLACE"}'::jsonb,
    p_artists => pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object(
      'matched_artist_id', v_artist_id,
      'display_name', '클라이언트 설명과 무관한 값',
      'normalized_name', 'jsonartist' || v_suffix,
      'aliases', '[]'::jsonb,
      'performance_date', '2099-03-01',
      'stage_name', 'MAIN',
      'status', 'confirmed'
    )),
    p_tickets => pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object(
      'existing_ticket_id', v_ticket_id,
      'round_name', '일반 예매',
      'price_info', '200원'
    )),
    p_source_type => 'instagram_manual',
    p_source_url => 'https://example.com/source',
    p_source_file_name => 'lineup-update.json',
    p_work_type => 'announcement',
    p_lineup_round => 'second',
    p_announcement_date => '2098-12-15'
  );

  v_event_id := (v_result->>'audit_event_id')::bigint;
  if (v_result->>'change_count')::integer <> 3 then
    raise exception '기본정보·라인업·티켓 실제 변경이 모두 기록되지 않았습니다: %', v_result;
  end if;
  if (select count(*) from public.audit_changes where event_id = v_event_id) <> 3 then
    raise exception 'JSON 한 파일이 하나의 감사 작업으로 묶이지 않았습니다.';
  end if;
  if not exists (
    select 1 from public.audit_events where id = v_event_id
      and source_file_name = 'lineup-update.json'
      and source_type = 'instagram_manual'
      and source_url = 'https://example.com/source'
      and lineup_round = 'second'
  ) then
    raise exception 'JSON 출처와 라인업 발표 메타데이터가 기록되지 않았습니다.';
  end if;
  if not exists (
    select 1 from public.audit_changes where event_id = v_event_id
      and entity_type = 'festival_artist'
      and before_data->>'stage_name' = 'OLD'
      and after_data->>'stage_name' = 'MAIN'
      and after_data->>'artist_name' = 'JSON 테스트 아티스트'
  ) then
    raise exception '클라이언트 설명이 아닌 실제 DB 전후 상태가 기록되지 않았습니다.';
  end if;
  if (select count(*) from public.festival_update_logs where festival_id = v_festival_id) <> v_legacy_count then
    raise exception '새 공통 감사 작업이 기존 부분 로그에도 중복 저장됐습니다.';
  end if;

  select count(*) into v_event_count from public.audit_events where festival_id = v_festival_id;
  begin
    perform public.apply_festival_json_update_with_audit(
      p_festival_id => v_festival_id,
      p_basic_changes => '{"location":"ROLLBACK PLACE"}'::jsonb,
      p_tickets => '[{"existing_ticket_id":999999999,"round_name":"실패"}]'::jsonb,
      p_source_file_name => 'rollback.json'
    );
    raise exception '실패해야 할 JSON 작업이 성공했습니다.';
  exception when sqlstate 'P0002' then null;
  end;

  if (select location from public.festivals where id = v_festival_id) <> 'NEW PLACE'
     or (select count(*) from public.audit_events where festival_id = v_festival_id) <> v_event_count then
    raise exception '실패한 JSON 작업의 데이터 또는 로그가 부분 반영됐습니다.';
  end if;
end;
$$;

rollback;
