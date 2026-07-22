-- 021, 022 마이그레이션 적용 후 검증용 DB에서 실행한다.
-- 마지막 ROLLBACK으로 테스트 데이터와 로그를 모두 제거한다.
begin;

do $$
declare
  v_admin_id uuid;
  v_festival_id bigint;
  v_artist_1 bigint;
  v_artist_2 bigint;
  v_artist_3 bigint;
  v_lineup_1 bigint;
  v_lineup_2 bigint;
  v_event_id bigint;
  v_suffix text := pg_catalog.txid_current()::text;
begin
  select id into v_admin_id from public.profiles
  where role = 'admin' order by created_at limit 1;
  if v_admin_id is null then
    raise exception '통합 테스트에 사용할 관리자 계정이 필요합니다.';
  end if;
  perform pg_catalog.set_config('request.jwt.claim.sub', v_admin_id::text, true);

  v_festival_id := public.create_festival_with_audit(pg_catalog.jsonb_build_object(
    'name', '라인업 감사 테스트', 'normalized_name', 'lineupaudittest' || v_suffix,
    'start_date', '2099-02-01', 'end_date', '2099-02-02',
    'status', 'scheduled', 'verification_status', 'pending'
  ));

  insert into public.artists (name, normalized_name)
  values ('라인업 테스트 1', 'lineuptestone' || v_suffix) returning id into v_artist_1;
  insert into public.artists (name, normalized_name)
  values ('라인업 테스트 2', 'lineuptesttwo' || v_suffix) returning id into v_artist_2;
  insert into public.artists (name, normalized_name)
  values ('라인업 테스트 3', 'lineuptestthree' || v_suffix) returning id into v_artist_3;

  insert into public.festival_artists (festival_id, artist_id, performance_date, stage_name, status)
  values (v_festival_id, v_artist_1, '2099-02-01', 'A', 'confirmed') returning id into v_lineup_1;
  insert into public.festival_artists (festival_id, artist_id, performance_date, stage_name, status)
  values (v_festival_id, v_artist_2, '2099-02-01', 'B', 'confirmed') returning id into v_lineup_2;

  v_event_id := public.apply_lineup_work_with_audit(
    v_festival_id, 'announcement', 'first', '2098-12-01',
    'https://example.com/lineup', null,
    pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object('operation', 'update', 'lineup_id', v_lineup_1, 'performance_date', '2099-02-02', 'stage_name', 'MAIN', 'status', 'confirmed'),
      pg_catalog.jsonb_build_object('operation', 'delete', 'lineup_id', v_lineup_2),
      pg_catalog.jsonb_build_object('operation', 'insert', 'artist_id', v_artist_3, 'performance_date', '2099-02-01', 'stage_name', 'NEW', 'status', 'confirmed')
    )
  );

  if (select count(*) from public.audit_changes where event_id = v_event_id) <> 3 then
    raise exception '여러 라인업 변경이 하나의 이벤트로 묶이지 않았습니다.';
  end if;
  if not exists (
    select 1 from public.audit_events
    where id = v_event_id and announcement_date = '2098-12-01'
      and created_at is not null and lineup_round = 'first'
  ) then
    raise exception '발표일·사이트 등록일시·차수가 기록되지 않았습니다.';
  end if;

  begin
    perform public.apply_lineup_work_with_audit(
      v_festival_id, 'announcement', 'second', null, null, null,
      pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object(
        'operation', 'insert', 'artist_id', v_artist_2, 'status', 'confirmed'
      ))
    );
    raise exception '필수값이 없는 발표가 저장되었습니다.';
  exception when sqlstate '22023' then
    null;
  end;
end;
$$;

rollback;
