-- 021~024 마이그레이션 적용 후 검증용 DB에서 실행한다.
-- 마지막 ROLLBACK으로 모든 테스트 데이터를 제거한다.
begin;

do $$
declare
  v_admin_id uuid;
  v_festival_id bigint;
  v_ticket_id bigint;
  v_result jsonb;
  v_event_count integer;
  v_suffix text := pg_catalog.txid_current()::text;
begin
  select id into v_admin_id from public.profiles
  where role = 'admin' order by created_at limit 1;
  if v_admin_id is null then raise exception '통합 테스트용 관리자 계정이 필요합니다.'; end if;
  perform pg_catalog.set_config('request.jwt.claim.sub', v_admin_id::text, true);

  v_festival_id := public.create_festival_with_audit(pg_catalog.jsonb_build_object(
    'name', '티켓 썸네일 감사 테스트', 'normalized_name', 'ticketthumbtest' || v_suffix,
    'start_date', '2099-04-01', 'end_date', '2099-04-02',
    'status', 'scheduled', 'verification_status', 'pending'
  ));

  v_result := public.change_festival_ticket_with_audit(
    v_festival_id, 'insert', null,
    '{"round_type":"early_bird","round_name":"얼리버드","open_at":"2099-01-01T11:00:00+09:00","price_info":"100원","ticket_url":"https://example.com/old","ticket_platform":"TEST"}'::jsonb,
    'https://example.com/source', '최초 등록'
  );
  v_ticket_id := (v_result#>>'{ticket,id}')::bigint;

  perform public.change_festival_ticket_with_audit(
    v_festival_id, 'update', v_ticket_id,
    '{"round_type":"regular","round_name":"일반 예매","open_at":"2099-01-02T11:00:00+09:00","price_info":"200원","ticket_url":"https://example.com/new","ticket_platform":"NEW"}'::jsonb,
    null, null
  );
  perform public.change_festival_ticket_with_audit(v_festival_id, 'delete', v_ticket_id, '{}'::jsonb, null, null);

  if (select count(*) from public.audit_events where festival_id = v_festival_id and action_type like 'ticket.%') <> 3 then
    raise exception '티켓 추가·수정·삭제 이벤트가 모두 기록되지 않았습니다.';
  end if;
  if not exists (
    select 1 from public.audit_changes c join public.audit_events e on e.id = c.event_id
    where e.festival_id = v_festival_id and e.action_type = 'ticket.updated'
      and c.before_data->>'round_name' = '얼리버드'
      and c.after_data->>'round_name' = '일반 예매'
      and c.before_data->>'price_info' = '100원'
      and c.after_data->>'ticket_url' = 'https://example.com/new'
  ) then raise exception '티켓 실제 전후 값이 기록되지 않았습니다.'; end if;

  perform public.change_festival_thumbnail_with_audit(v_festival_id, 'https://example.com/one.webp', null, '업로드');
  perform public.change_festival_thumbnail_with_audit(v_festival_id, 'https://example.com/two.webp', null, '교체');
  perform public.change_festival_thumbnail_with_audit(v_festival_id, null, null, '삭제');

  if (select count(*) from public.audit_events where festival_id = v_festival_id and action_type like 'thumbnail.%') <> 3 then
    raise exception '썸네일 업로드·교체·삭제 이벤트가 모두 기록되지 않았습니다.';
  end if;
  if not exists (
    select 1 from public.audit_changes c join public.audit_events e on e.id = c.event_id
    where e.festival_id = v_festival_id and e.action_type = 'thumbnail.replaced'
      and c.before_data = '{"thumbnail_url":"https://example.com/one.webp"}'::jsonb
      and c.after_data = '{"thumbnail_url":"https://example.com/two.webp"}'::jsonb
  ) then raise exception '썸네일 URL 전후 값만 정확히 기록되지 않았습니다.'; end if;

  select count(*) into v_event_count from public.audit_events where festival_id = v_festival_id;
  begin
    perform public.change_festival_ticket_with_audit(v_festival_id, 'update', 999999999, '{"round_name":"실패"}'::jsonb, null, null);
    raise exception '실패해야 할 티켓 작업이 성공했습니다.';
  exception when sqlstate 'P0002' then null;
  end;
  if (select count(*) from public.audit_events where festival_id = v_festival_id) <> v_event_count then
    raise exception '실패한 티켓 작업에 로그가 남았습니다.';
  end if;

  if pg_catalog.has_table_privilege('authenticated', 'public.audit_events', 'insert')
     or pg_catalog.has_table_privilege('authenticated', 'public.audit_changes', 'update')
     or pg_catalog.has_table_privilege('authenticated', 'public.audit_changes', 'delete') then
    raise exception '감사 로그 불변 권한이 깨졌습니다.';
  end if;
end;
$$;

rollback;
