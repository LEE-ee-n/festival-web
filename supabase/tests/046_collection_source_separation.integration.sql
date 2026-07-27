-- Migration 046 적용 후 검증용 DB에서 실행한다.
-- 마지막 ROLLBACK으로 모든 테스트 데이터를 제거한다.
begin;

do $$
declare
  v_source_url text := 'https://www.instagram.com/p/source-separation-test/';
  v_candidate_id bigint;
  v_festival_id bigint;
begin
  insert into public.festival_candidates (
    title,
    source_url,
    source_type,
    festival_name,
    start_date,
    end_date,
    status,
    work_type
  ) values (
    '출처 분리 테스트',
    v_source_url,
    'integration_test',
    '출처 분리 테스트',
    '2099-10-03',
    '2099-10-05',
    'pending',
    'new'
  )
  returning id into v_candidate_id;

  insert into public.festivals (
    name,
    normalized_name,
    start_date,
    end_date,
    source_url,
    status,
    verification_status
  ) values (
    '출처 분리 테스트',
    'sourceseparationtest' || pg_catalog.txid_current()::text,
    '2099-10-03',
    '2099-10-05',
    v_source_url,
    'scheduled',
    'approved'
  )
  returning id into v_festival_id;

  if (
    select source_url is not null
    from public.festivals
    where id = v_festival_id
  ) then
    raise exception '후보 수집 URL이 festivals.source_url에 복사되었습니다.';
  end if;

  if (
    select source_url is distinct from v_source_url
    from public.festival_candidates
    where id = v_candidate_id
  ) then
    raise exception '후보의 수집 URL이 유지되지 않았습니다.';
  end if;
end;
$$;

rollback;
