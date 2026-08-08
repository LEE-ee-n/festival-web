-- 선택한 아티스트별 상태·메모·곡·평점 기록과 단계형 작성 흐름

begin;

alter table public.user_festival_performances
  add column if not exists experience_status text,
  add constraint user_festival_performances_experience_status
    check (experience_status is null or experience_status in ('watched', 'briefly', 'missed'));

create or replace function public.save_user_festival_record(
  p_record_id bigint,
  p_festival_id bigint,
  p_attended_dates date[],
  p_summary text,
  p_cover_image_url text,
  p_festival_artist_ids bigint[]
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_record_id bigint;
  v_attended_dates date[];
  v_artist_ids bigint[] := coalesce(p_festival_artist_ids, '{}'::bigint[]);
begin
  if v_user_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  select coalesce(array_agg(distinct selected_date order by selected_date), '{}'::date[])
  into v_attended_dates
  from unnest(coalesce(p_attended_dates, '{}'::date[])) as selected_dates(selected_date);

  if cardinality(v_attended_dates) = 0 then
    raise exception '참여 날짜를 한 개 이상 선택해주세요.';
  end if;

  if not exists (
    select 1
    from public.festivals f
    where f.id = p_festival_id
      and f.verification_status = 'approved'
      and f.status in ('ongoing', 'ended')
      and not exists (
        select 1
        from unnest(v_attended_dates) as selected_dates(selected_date)
        where selected_date not between f.start_date and f.end_date
      )
  ) then
    raise exception '페스티벌 기간에 포함되는 날짜만 선택할 수 있습니다.';
  end if;

  if p_record_id is null then
    insert into public.user_festival_diaries (
      user_id, festival_id, attended_date, attended_dates,
      title, content, summary, cover_image_url
    ) values (
      v_user_id, p_festival_id, v_attended_dates[1], v_attended_dates,
      left(pg_catalog.btrim(p_summary), 100), pg_catalog.btrim(p_summary),
      pg_catalog.btrim(p_summary), nullif(pg_catalog.btrim(p_cover_image_url), '')
    ) returning id into v_record_id;
  else
    update public.user_festival_diaries
    set attended_date = v_attended_dates[1],
        attended_dates = v_attended_dates,
        title = left(pg_catalog.btrim(p_summary), 100),
        content = pg_catalog.btrim(p_summary),
        summary = pg_catalog.btrim(p_summary),
        cover_image_url = nullif(pg_catalog.btrim(p_cover_image_url), '')
    where id = p_record_id
      and user_id = v_user_id
      and festival_id = p_festival_id
    returning id into v_record_id;

    if v_record_id is null then
      raise exception '수정할 기록을 찾을 수 없습니다.';
    end if;
  end if;

  delete from public.user_festival_performances
  where user_festival_diary_id = v_record_id
    and not (festival_artist_id = any(v_artist_ids));

  insert into public.user_festival_performances (
    user_festival_diary_id, festival_artist_id
  )
  select v_record_id, fa.id
  from public.festival_artists fa
  where fa.festival_id = p_festival_id
    and fa.id = any(v_artist_ids)
    and coalesce(fa.status, 'confirmed') <> 'cancelled'
  on conflict (user_festival_diary_id, festival_artist_id) do nothing;

  return v_record_id;
end;
$$;

create or replace function public.save_user_festival_artist_record(
  p_record_performance_id bigint,
  p_experience_status text,
  p_rating smallint,
  p_memo text,
  p_song_names text[]
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_performance_id bigint;
begin
  if v_user_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if p_experience_status not in ('watched', 'briefly', 'missed') then
    raise exception '기록 상태를 선택해주세요.';
  end if;

  if p_rating is not null and p_rating not between 1 and 5 then
    raise exception '평점은 1점부터 5점까지 선택할 수 있습니다.';
  end if;

  update public.user_festival_performances performance
  set experience_status = p_experience_status,
      rating = p_rating,
      memo = nullif(pg_catalog.btrim(p_memo), '')
  from public.user_festival_diaries diary
  where performance.id = p_record_performance_id
    and diary.id = performance.user_festival_diary_id
    and diary.user_id = v_user_id
  returning performance.id into v_performance_id;

  if v_performance_id is null then
    raise exception '수정할 아티스트 기록을 찾을 수 없습니다.';
  end if;

  delete from public.user_festival_songs
  where user_festival_performance_id = v_performance_id;

  insert into public.user_festival_songs (
    user_festival_performance_id, song_name
  )
  select v_performance_id, song_name
  from (
    select distinct pg_catalog.btrim(raw_song_name) as song_name
    from unnest(coalesce(p_song_names, '{}'::text[])) as song_names(raw_song_name)
  ) normalized_songs
  where song_name <> '';

  return v_performance_id;
end;
$$;

revoke all on function public.save_user_festival_artist_record(
  bigint, text, smallint, text, text[]
) from public, anon;
grant execute on function public.save_user_festival_artist_record(
  bigint, text, smallint, text, text[]
) to authenticated;

commit;
