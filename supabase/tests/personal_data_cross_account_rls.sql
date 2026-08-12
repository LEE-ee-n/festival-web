-- 운영 회원 식별정보를 출력하지 않고 두 일반 회원의 개인 데이터 격리를 검증한다.
-- 모든 fixture와 DML은 마지막 ROLLBACK으로 제거된다.
begin;

do $$
declare
  v_user_a uuid;
  v_user_b uuid;
  v_artist_1 bigint;
  v_artist_2 bigint;
  v_festival_1 bigint;
  v_festival_2 bigint;
  v_festival_artist_1 bigint;
  v_festival_artist_2 bigint;
  v_schedule_artist_1 bigint;
  v_schedule_artist_2 bigint;
  v_diary_a bigint;
  v_diary_b bigint;
  v_performance_a bigint;
  v_performance_b bigint;
  v_song_a bigint;
  v_song_b bigint;
  v_media_a bigint;
  v_media_b bigint;
begin
  select id
  into v_user_a
  from public.profiles
  where role = 'user'
  order by created_at, id
  limit 1;

  select id
  into v_user_b
  from public.profiles
  where role = 'user'
    and id <> v_user_a
  order by created_at, id
  limit 1;

  if v_user_a is null or v_user_b is null or v_user_a = v_user_b then
    raise exception 'RLS 시험에는 서로 다른 일반 회원 두 명이 필요합니다.';
  end if;

  select artist.id
  into v_artist_1
  from public.artists artist
  where not exists (
    select 1
    from public.user_favorite_artists favorite
    where favorite.artist_id = artist.id
      and favorite.user_id in (v_user_a, v_user_b)
  )
  order by artist.id
  limit 1;

  select artist.id
  into v_artist_2
  from public.artists artist
  where artist.id <> v_artist_1
    and not exists (
      select 1
      from public.user_favorite_artists favorite
      where favorite.artist_id = artist.id
        and favorite.user_id in (v_user_a, v_user_b)
    )
  order by artist.id
  limit 1;

  select festival.id, festival_artist.id
  into v_festival_1, v_festival_artist_1
  from public.festivals festival
  join public.festival_artists festival_artist
    on festival_artist.festival_id = festival.id
   and coalesce(festival_artist.status, 'confirmed') <> 'cancelled'
  where festival.verification_status = 'approved'
    and festival.status in ('ongoing', 'ended')
    and not exists (
      select 1
      from public.user_festival_diaries diary
      where diary.festival_id = festival.id
        and diary.user_id in (v_user_a, v_user_b)
    )
    and not exists (
      select 1
      from public.user_schedule_items schedule
      where schedule.festival_artist_id = festival_artist.id
        and schedule.user_id in (v_user_a, v_user_b)
    )
  order by festival.id, festival_artist.id
  limit 1;

  select festival_artist.id
  into v_schedule_artist_1
  from public.festival_artists festival_artist
  join public.festivals festival on festival.id = festival_artist.festival_id
  where festival.verification_status = 'approved'
    and festival.status in ('scheduled', 'ongoing')
    and festival_artist.status in ('scheduled', 'confirmed')
    and not exists (
      select 1 from public.user_schedule_items schedule
      where schedule.festival_artist_id = festival_artist.id
        and schedule.user_id in (v_user_a, v_user_b)
    )
  order by festival_artist.id
  limit 1;

  select festival_artist.id
  into v_schedule_artist_2
  from public.festival_artists festival_artist
  join public.festivals festival on festival.id = festival_artist.festival_id
  where festival_artist.id <> v_schedule_artist_1
    and festival.verification_status = 'approved'
    and festival.status in ('scheduled', 'ongoing')
    and festival_artist.status in ('scheduled', 'confirmed')
    and not exists (
      select 1 from public.user_schedule_items schedule
      where schedule.festival_artist_id = festival_artist.id
        and schedule.user_id in (v_user_a, v_user_b)
    )
  order by festival_artist.id
  limit 1;

  select festival.id, festival_artist.id
  into v_festival_2, v_festival_artist_2
  from public.festivals festival
  join public.festival_artists festival_artist
    on festival_artist.festival_id = festival.id
   and coalesce(festival_artist.status, 'confirmed') <> 'cancelled'
  where festival.id <> v_festival_1
    and festival.verification_status = 'approved'
    and festival.status in ('ongoing', 'ended')
    and not exists (
      select 1
      from public.user_festival_diaries diary
      where diary.festival_id = festival.id
        and diary.user_id in (v_user_a, v_user_b)
    )
    and not exists (
      select 1
      from public.user_schedule_items schedule
      where schedule.festival_artist_id = festival_artist.id
        and schedule.user_id in (v_user_a, v_user_b)
    )
  order by festival.id, festival_artist.id
  limit 1;

  if v_artist_1 is null or v_artist_2 is null
     or v_festival_1 is null or v_festival_2 is null
     or v_festival_artist_1 is null or v_festival_artist_2 is null
     or v_schedule_artist_1 is null or v_schedule_artist_2 is null then
    raise exception 'RLS fixture에 사용할 공개 축제·아티스트 데이터가 부족합니다.';
  end if;

  insert into public.user_favorite_artists (user_id, artist_id)
  values (v_user_a, v_artist_1), (v_user_b, v_artist_1);

  insert into public.user_favorite_festivals (user_id, festival_id)
  values (v_user_a, v_festival_1), (v_user_b, v_festival_1);

  insert into public.user_schedule_items (user_id, festival_artist_id)
  values (v_user_a, v_schedule_artist_1), (v_user_b, v_schedule_artist_1);

  insert into public.user_festival_diaries (
    user_id, festival_id, attended_date, attended_dates, title, content, summary
  )
  select
    fixture.user_id,
    festival.id,
    festival.start_date,
    array[festival.start_date],
    'RLS 격리 시험',
    '트랜잭션 종료 시 제거되는 RLS 격리 시험 데이터',
    'RLS 격리 시험'
  from public.festivals festival
  cross join (values (v_user_a), (v_user_b)) fixture(user_id)
  where festival.id = v_festival_1;

  select id into v_diary_a
  from public.user_festival_diaries
  where user_id = v_user_a and festival_id = v_festival_1;
  select id into v_diary_b
  from public.user_festival_diaries
  where user_id = v_user_b and festival_id = v_festival_1;

  insert into public.user_festival_performances (
    user_festival_diary_id, festival_artist_id, experience_status, rating, memo
  ) values
    (v_diary_a, v_festival_artist_1, 'watched', 5, 'RLS 격리 시험 A'),
    (v_diary_b, v_festival_artist_1, 'watched', 5, 'RLS 격리 시험 B');

  select id into v_performance_a
  from public.user_festival_performances
  where user_festival_diary_id = v_diary_a;
  select id into v_performance_b
  from public.user_festival_performances
  where user_festival_diary_id = v_diary_b;

  insert into public.user_festival_songs (
    user_festival_performance_id, song_name
  ) values
    (v_performance_a, 'RLS 격리 시험곡 A'),
    (v_performance_b, 'RLS 격리 시험곡 B');

  select id into v_song_a from public.user_festival_songs
  where user_festival_performance_id = v_performance_a;
  select id into v_song_b from public.user_festival_songs
  where user_festival_performance_id = v_performance_b;

  insert into public.user_festival_media (
    user_festival_performance_id, provider, external_file_id, file_type
  ) values
    (v_performance_a, 'rls-test', 'rls-test-a', 'image'),
    (v_performance_b, 'rls-test', 'rls-test-b', 'image');

  select id into v_media_a from public.user_festival_media
  where user_festival_performance_id = v_performance_a;
  select id into v_media_b from public.user_festival_media
  where user_festival_performance_id = v_performance_b;

  insert into public.service_access_entitlements (
    user_id, entitlement_key, source, status
  ) values
    (v_user_a, 'personal_features', 'beta_manual', 'active'),
    (v_user_b, 'personal_features', 'beta_manual', 'active')
  on conflict do nothing;

  insert into public.user_notification_preferences (user_id)
  values (v_user_a), (v_user_b)
  on conflict (user_id) do nothing;

  insert into public.user_push_devices (
    user_id, expo_push_token, platform, app_version
  ) values
    (v_user_a, 'ExpoPushToken[rlstest-a-000000000001]', 'android', 'rls-test'),
    (v_user_b, 'ExpoPushToken[rlstest-b-000000000002]', 'android', 'rls-test');

  perform pg_catalog.set_config('rls_test.user_a', v_user_a::text, true);
  perform pg_catalog.set_config('rls_test.user_b', v_user_b::text, true);
  perform pg_catalog.set_config('rls_test.artist_1', v_artist_1::text, true);
  perform pg_catalog.set_config('rls_test.artist_2', v_artist_2::text, true);
  perform pg_catalog.set_config('rls_test.festival_1', v_festival_1::text, true);
  perform pg_catalog.set_config('rls_test.festival_2', v_festival_2::text, true);
  perform pg_catalog.set_config('rls_test.festival_artist_1', v_festival_artist_1::text, true);
  perform pg_catalog.set_config('rls_test.festival_artist_2', v_festival_artist_2::text, true);
  perform pg_catalog.set_config('rls_test.schedule_artist_1', v_schedule_artist_1::text, true);
  perform pg_catalog.set_config('rls_test.schedule_artist_2', v_schedule_artist_2::text, true);
  perform pg_catalog.set_config('rls_test.diary_a', v_diary_a::text, true);
  perform pg_catalog.set_config('rls_test.diary_b', v_diary_b::text, true);
  perform pg_catalog.set_config('rls_test.performance_a', v_performance_a::text, true);
  perform pg_catalog.set_config('rls_test.performance_b', v_performance_b::text, true);
  perform pg_catalog.set_config('rls_test.song_a', v_song_a::text, true);
  perform pg_catalog.set_config('rls_test.song_b', v_song_b::text, true);
  perform pg_catalog.set_config('rls_test.media_a', v_media_a::text, true);
  perform pg_catalog.set_config('rls_test.media_b', v_media_b::text, true);
end;
$$;

set local role authenticated;

do $$
declare
  v_user_a uuid := pg_catalog.current_setting('rls_test.user_a')::uuid;
  v_user_b uuid := pg_catalog.current_setting('rls_test.user_b')::uuid;
  v_artist_1 bigint := pg_catalog.current_setting('rls_test.artist_1')::bigint;
  v_artist_2 bigint := pg_catalog.current_setting('rls_test.artist_2')::bigint;
  v_festival_1 bigint := pg_catalog.current_setting('rls_test.festival_1')::bigint;
  v_festival_2 bigint := pg_catalog.current_setting('rls_test.festival_2')::bigint;
  v_festival_artist_1 bigint := pg_catalog.current_setting('rls_test.festival_artist_1')::bigint;
  v_festival_artist_2 bigint := pg_catalog.current_setting('rls_test.festival_artist_2')::bigint;
  v_schedule_artist_1 bigint := pg_catalog.current_setting('rls_test.schedule_artist_1')::bigint;
  v_schedule_artist_2 bigint := pg_catalog.current_setting('rls_test.schedule_artist_2')::bigint;
  v_actor uuid;
  v_target uuid;
  v_actor_diary bigint;
  v_target_diary bigint;
  v_actor_performance bigint;
  v_target_performance bigint;
  v_target_song bigint;
  v_target_media bigint;
  v_direction integer;
  v_rows bigint;
  v_own_diary bigint;
  v_rpc_denied boolean;
begin
  for v_direction in 1..2 loop
    if v_direction = 1 then
      v_actor := v_user_a;
      v_target := v_user_b;
      v_actor_diary := pg_catalog.current_setting('rls_test.diary_a')::bigint;
      v_target_diary := pg_catalog.current_setting('rls_test.diary_b')::bigint;
      v_actor_performance := pg_catalog.current_setting('rls_test.performance_a')::bigint;
      v_target_performance := pg_catalog.current_setting('rls_test.performance_b')::bigint;
      v_target_song := pg_catalog.current_setting('rls_test.song_b')::bigint;
      v_target_media := pg_catalog.current_setting('rls_test.media_b')::bigint;
    else
      v_actor := v_user_b;
      v_target := v_user_a;
      v_actor_diary := pg_catalog.current_setting('rls_test.diary_b')::bigint;
      v_target_diary := pg_catalog.current_setting('rls_test.diary_a')::bigint;
      v_actor_performance := pg_catalog.current_setting('rls_test.performance_b')::bigint;
      v_target_performance := pg_catalog.current_setting('rls_test.performance_a')::bigint;
      v_target_song := pg_catalog.current_setting('rls_test.song_a')::bigint;
      v_target_media := pg_catalog.current_setting('rls_test.media_a')::bigint;
    end if;

    perform pg_catalog.set_config('request.jwt.claim.sub', v_actor::text, true);
    perform pg_catalog.set_config('request.jwt.claim.role', 'authenticated', true);

    if (select count(*) from public.profiles where id = v_target) <> 0
       or (select count(*) from public.user_favorite_artists where user_id = v_target) <> 0
       or (select count(*) from public.user_favorite_festivals where user_id = v_target) <> 0
       or (select count(*) from public.user_schedule_items where user_id = v_target) <> 0
       or (select count(*) from public.user_festival_diaries where id = v_target_diary) <> 0
       or (select count(*) from public.user_festival_performances where id = v_target_performance) <> 0
       or (select count(*) from public.user_festival_songs where id = v_target_song) <> 0
       or (select count(*) from public.user_festival_media where id = v_target_media) <> 0 then
      raise exception '교차 계정 SELECT가 허용되었습니다.';
    end if;

    if (select count(*) from public.user_push_devices where user_id = v_target) <> 0
       or (select count(*) from public.user_notification_preferences where user_id = v_target) <> 0 then
      raise exception '교차 계정 앱 설정 SELECT가 허용되었습니다.';
    end if;

    begin perform 1 from public.notification_events;
      raise exception '일반 회원의 알림 이벤트 SELECT가 허용되었습니다.';
    exception when insufficient_privilege then null; end;
    begin perform 1 from public.notification_deliveries;
      raise exception '일반 회원의 알림 발송 기록 SELECT가 허용되었습니다.';
    exception when insufficient_privilege then null; end;

    begin
      perform 1 from public.service_access_entitlements where user_id = v_target;
      raise exception '이용권 직접 SELECT가 허용되었습니다.';
    exception when insufficient_privilege then null;
    end;

    begin insert into public.profiles (id, role) values (v_target, 'user');
      raise exception 'profiles 교차 INSERT가 허용되었습니다.';
    exception when insufficient_privilege then null; end;
    begin update public.profiles set display_name = 'RLS 침범' where id = v_target;
      raise exception 'profiles 교차 UPDATE가 허용되었습니다.';
    exception when insufficient_privilege then null; end;
    begin delete from public.profiles where id = v_target;
      raise exception 'profiles 교차 DELETE가 허용되었습니다.';
    exception when insufficient_privilege then null; end;

    begin insert into public.user_favorite_artists (user_id, artist_id) values (v_target, v_artist_2);
      raise exception '관심 아티스트 교차 INSERT가 허용되었습니다.';
    exception when insufficient_privilege then null; end;
    begin update public.user_favorite_artists set artist_id = v_artist_2 where user_id = v_target and artist_id = v_artist_1;
      raise exception '관심 아티스트 UPDATE 권한이 허용되었습니다.';
    exception when insufficient_privilege then null; end;
    delete from public.user_favorite_artists where user_id = v_target and artist_id = v_artist_1;
    get diagnostics v_rows = row_count;
    if v_rows <> 0 then raise exception '관심 아티스트 교차 DELETE가 허용되었습니다.'; end if;

    begin insert into public.user_favorite_festivals (user_id, festival_id) values (v_target, v_festival_2);
      raise exception '관심 축제 교차 INSERT가 허용되었습니다.';
    exception when insufficient_privilege then null; end;
    begin update public.user_favorite_festivals set festival_id = v_festival_2 where user_id = v_target and festival_id = v_festival_1;
      raise exception '관심 축제 UPDATE 권한이 허용되었습니다.';
    exception when insufficient_privilege then null; end;
    delete from public.user_favorite_festivals where user_id = v_target and festival_id = v_festival_1;
    get diagnostics v_rows = row_count;
    if v_rows <> 0 then raise exception '관심 축제 교차 DELETE가 허용되었습니다.'; end if;

    begin insert into public.user_schedule_items (user_id, festival_artist_id) values (v_target, v_schedule_artist_2);
      raise exception '개인 일정 교차 INSERT가 허용되었습니다.';
    exception when insufficient_privilege then null; end;
    begin update public.user_schedule_items set festival_artist_id = v_schedule_artist_2 where user_id = v_target and festival_artist_id = v_schedule_artist_1;
      raise exception '개인 일정 UPDATE 권한이 허용되었습니다.';
    exception when insufficient_privilege then null; end;
    delete from public.user_schedule_items where user_id = v_target and festival_artist_id = v_schedule_artist_1;
    get diagnostics v_rows = row_count;
    if v_rows <> 0 then raise exception '개인 일정 교차 DELETE가 허용되었습니다.'; end if;

    begin
      insert into public.user_festival_diaries (
        user_id, festival_id, attended_date, attended_dates, title, content
      )
      select v_target, id, start_date, array[start_date], 'RLS 침범', 'RLS 침범'
      from public.festivals where id = v_festival_2;
      raise exception '페스티벌 기록 교차 INSERT가 허용되었습니다.';
    exception when insufficient_privilege then null; end;
    update public.user_festival_diaries set title = 'RLS 침범' where id = v_target_diary;
    get diagnostics v_rows = row_count;
    if v_rows <> 0 then raise exception '페스티벌 기록 교차 UPDATE가 허용되었습니다.'; end if;
    delete from public.user_festival_diaries where id = v_target_diary;
    get diagnostics v_rows = row_count;
    if v_rows <> 0 then raise exception '페스티벌 기록 교차 DELETE가 허용되었습니다.'; end if;

    begin insert into public.user_festival_performances (user_festival_diary_id, festival_artist_id) values (v_target_diary, v_festival_artist_2);
      raise exception '공연 기록 교차 INSERT가 허용되었습니다.';
    exception when insufficient_privilege then null; end;
    update public.user_festival_performances set memo = 'RLS 침범' where id = v_target_performance;
    get diagnostics v_rows = row_count;
    if v_rows <> 0 then raise exception '공연 기록 교차 UPDATE가 허용되었습니다.'; end if;
    delete from public.user_festival_performances where id = v_target_performance;
    get diagnostics v_rows = row_count;
    if v_rows <> 0 then raise exception '공연 기록 교차 DELETE가 허용되었습니다.'; end if;
    begin update public.user_festival_performances set user_festival_diary_id = v_target_diary where id = v_actor_performance;
      raise exception '공연 기록 부모 소유자 변경이 허용되었습니다.';
    exception when insufficient_privilege then null; end;

    begin insert into public.user_festival_songs (user_festival_performance_id, song_name) values (v_target_performance, 'RLS 침범');
      raise exception '곡 기록 교차 INSERT가 허용되었습니다.';
    exception when insufficient_privilege then null; end;
    update public.user_festival_songs set song_name = 'RLS 침범' where id = v_target_song;
    get diagnostics v_rows = row_count;
    if v_rows <> 0 then raise exception '곡 기록 교차 UPDATE가 허용되었습니다.'; end if;
    delete from public.user_festival_songs where id = v_target_song;
    get diagnostics v_rows = row_count;
    if v_rows <> 0 then raise exception '곡 기록 교차 DELETE가 허용되었습니다.'; end if;

    begin insert into public.user_festival_media (user_festival_performance_id, provider, external_file_id, file_type) values (v_target_performance, 'rls-test', 'cross-account', 'image');
      raise exception '미디어 기록 교차 INSERT가 허용되었습니다.';
    exception when insufficient_privilege then null; end;
    update public.user_festival_media set provider = 'RLS 침범' where id = v_target_media;
    get diagnostics v_rows = row_count;
    if v_rows <> 0 then raise exception '미디어 기록 교차 UPDATE가 허용되었습니다.'; end if;
    delete from public.user_festival_media where id = v_target_media;
    get diagnostics v_rows = row_count;
    if v_rows <> 0 then raise exception '미디어 기록 교차 DELETE가 허용되었습니다.'; end if;

    begin insert into public.service_access_entitlements (user_id, entitlement_key, source, status) values (v_target, 'personal_features', 'beta_manual', 'active');
      raise exception '이용권 직접 INSERT가 허용되었습니다.';
    exception when insufficient_privilege then null; end;
    begin update public.service_access_entitlements set status = 'revoked' where user_id = v_target;
      raise exception '이용권 직접 UPDATE가 허용되었습니다.';
    exception when insufficient_privilege then null; end;
    begin delete from public.service_access_entitlements where user_id = v_target;
      raise exception '이용권 직접 DELETE가 허용되었습니다.';
    exception when insufficient_privilege then null; end;

    begin insert into public.user_notification_preferences (user_id) values (v_target);
      raise exception '알림 설정 교차 INSERT가 허용되었습니다.';
    exception when insufficient_privilege then null; end;
    update public.user_notification_preferences
    set favorite_artist_appearance = false where user_id = v_target;
    get diagnostics v_rows = row_count;
    if v_rows <> 0 then raise exception '알림 설정 교차 UPDATE가 허용되었습니다.'; end if;

    begin insert into public.user_push_devices (
      user_id, expo_push_token, platform, app_version
    ) values (v_target, 'ExpoPushToken[cross-account-test]', 'android', 'rls-test');
      raise exception '기기 교차 INSERT가 허용되었습니다.';
    exception when insufficient_privilege then null; end;
    delete from public.user_push_devices where user_id = v_target;
    get diagnostics v_rows = row_count;
    if v_rows <> 0 then raise exception '기기 교차 DELETE가 허용되었습니다.'; end if;

    v_rpc_denied := false;
    begin
      perform public.save_user_festival_record(
        v_target_diary, v_festival_1,
        array[(select start_date from public.festivals where id = v_festival_1)],
        'RLS 침범', '', array[v_festival_artist_1]
      );
    exception when raise_exception then v_rpc_denied := true; end;
    if not v_rpc_denied then
      raise exception '페스티벌 기록 RPC 교차 UPDATE가 허용되었습니다.';
    end if;

    v_rpc_denied := false;
    begin
      perform public.save_user_festival_artist_record(
        v_target_performance, 'watched', 1::smallint, 'RLS 침범', array['RLS 침범']
      );
    exception when raise_exception then v_rpc_denied := true; end;
    if not v_rpc_denied then
      raise exception '아티스트 기록 RPC 교차 UPDATE가 허용되었습니다.';
    end if;
  end loop;

  perform pg_catalog.set_config('request.jwt.claim.sub', v_user_a::text, true);

  if (select count(*) from public.profiles where id = v_user_a) <> 1 then
    raise exception '본인 profiles SELECT가 거부되었습니다.';
  end if;

  delete from public.user_favorite_artists where user_id = v_user_a and artist_id = v_artist_1;
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then raise exception '본인 관심 아티스트 DELETE가 거부되었습니다.'; end if;
  insert into public.user_favorite_artists (user_id, artist_id) values (v_user_a, v_artist_1);

  delete from public.user_favorite_festivals where user_id = v_user_a and festival_id = v_festival_1;
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then raise exception '본인 관심 축제 DELETE가 거부되었습니다.'; end if;
  insert into public.user_favorite_festivals (user_id, festival_id) values (v_user_a, v_festival_1);

  update public.user_notification_preferences
  set favorite_artist_appearance = false
  where user_id = v_user_a;
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then raise exception '본인 알림 설정 UPDATE가 거부되었습니다.'; end if;

  delete from public.user_push_devices
  where user_id = v_user_a and expo_push_token = 'ExpoPushToken[rlstest-a-000000000001]';
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then raise exception '본인 기기 DELETE가 거부되었습니다.'; end if;

  perform public.register_push_device(
    'ExpoPushToken[rlstest-a-recreated]', 'android', 'rls-test'
  );
  if not public.deactivate_push_device('ExpoPushToken[rlstest-a-recreated]') then
    raise exception '본인 기기 비활성화 RPC가 거부되었습니다.';
  end if;

  delete from public.user_schedule_items where user_id = v_user_a and festival_artist_id = v_schedule_artist_1;
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then raise exception '본인 일정 DELETE가 거부되었습니다.'; end if;
  insert into public.user_schedule_items (user_id, festival_artist_id) values (v_user_a, v_schedule_artist_1);

  insert into public.user_festival_diaries (
    user_id, festival_id, attended_date, attended_dates, title, content
  )
  select v_user_a, id, start_date, array[start_date], 'RLS 본인 시험', 'RLS 본인 시험'
  from public.festivals where id = v_festival_2
  returning id into v_own_diary;
  delete from public.user_festival_diaries where id = v_own_diary;
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then raise exception '본인 페스티벌 기록 DELETE가 거부되었습니다.'; end if;

  update public.user_festival_diaries
  set title = 'RLS 본인 직접 UPDATE 시험'
  where id = pg_catalog.current_setting('rls_test.diary_a')::bigint;
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then raise exception '본인 페스티벌 기록 직접 UPDATE가 거부되었습니다.'; end if;

  update public.user_festival_performances
  set memo = 'RLS 본인 UPDATE 시험'
  where id = pg_catalog.current_setting('rls_test.performance_a')::bigint;
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then raise exception '본인 공연 기록 UPDATE가 거부되었습니다.'; end if;

  update public.user_festival_songs
  set song_name = 'RLS 본인 UPDATE 시험곡'
  where id = pg_catalog.current_setting('rls_test.song_a')::bigint;
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then raise exception '본인 곡 기록 UPDATE가 거부되었습니다.'; end if;

  update public.user_festival_media
  set provider = 'rls-own-test'
  where id = pg_catalog.current_setting('rls_test.media_a')::bigint;
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then raise exception '본인 미디어 기록 UPDATE가 거부되었습니다.'; end if;

  perform public.save_user_festival_record(
    pg_catalog.current_setting('rls_test.diary_a')::bigint,
    v_festival_1,
    array[(select start_date from public.festivals where id = v_festival_1)],
    'RLS 본인 RPC 시험', '', array[v_festival_artist_1]
  );
  perform public.save_user_festival_artist_record(
    pg_catalog.current_setting('rls_test.performance_a')::bigint,
    'watched', 5::smallint, 'RLS 본인 RPC 시험', array['RLS 본인 RPC 시험곡']
  );
end;
$$;

reset role;
rollback;

select jsonb_build_object(
  'status', 'PASS',
  'accounts', 2,
  'tables', 13,
  'rpcs', 4,
  'persistent_test_rows', 0
) as personal_data_cross_account_rls_result;
