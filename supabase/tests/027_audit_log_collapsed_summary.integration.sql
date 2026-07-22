begin;

do $$
declare
  v_admin_id uuid;
  v_festival_id bigint;
  v_result jsonb;
  v_event_id bigint;
  v_suffix text := pg_catalog.txid_current()::text;
begin
  select id into v_admin_id from public.profiles where role = 'admin' order by created_at limit 1;
  if v_admin_id is null then raise exception '통합 테스트용 관리자 계정이 필요합니다.'; end if;
  perform pg_catalog.set_config('request.jwt.claim.sub', v_admin_id::text, true);

  v_festival_id := public.create_festival_with_audit(pg_catalog.jsonb_build_object(
    'name', '감사 요약 테스트', 'normalized_name', 'auditsummary' || v_suffix,
    'start_date', '2099-06-01', 'end_date', '2099-06-02',
    'status', 'scheduled', 'verification_status', 'approved'
  ));

  v_result := public.apply_festival_json_update_with_summary(
    v_festival_id,
    pg_catalog.jsonb_build_object('name', '감사 요약 테스트 변경'),
    '[]'::jsonb, '[]'::jsonb, 'test', null, 'test.json',
    null, null, null, null,
    '{"total":{"maintained":3,"added":0,"changed":1,"deleted":0,"skipped":0},"sections":{"basic":{"maintained":3,"added":0,"changed":1,"deleted":0,"skipped":0}}}'::jsonb
  );
  v_event_id := (v_result->>'audit_event_id')::bigint;

  if (select audit_summary#>>'{total,maintained}' from public.audit_events where id = v_event_id) <> '3'
     or (select audit_summary#>>'{total,changed}' from public.audit_events where id = v_event_id) <> '1' then
    raise exception 'JSON 감사 요약이 저장되지 않았습니다.';
  end if;
end;
$$;

rollback;
