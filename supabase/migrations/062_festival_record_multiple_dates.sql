-- 개인 페스티벌 기록에서 행사 기간 내 참여 날짜를 복수 선택한다.

begin;

alter table public.user_festival_diaries
  add column if not exists attended_dates date[];

update public.user_festival_diaries
set attended_dates = array[attended_date]
where attended_dates is null or cardinality(attended_dates) = 0;

alter table public.user_festival_diaries
  alter column attended_dates set not null,
  add constraint user_festival_diaries_attended_dates_count
    check (cardinality(attended_dates) between 1 and 31),
  add constraint user_festival_diaries_attended_dates_no_null
    check (array_position(attended_dates, null) is null);

revoke update (attended_date, attended_dates)
on public.user_festival_diaries from authenticated;

revoke all on function public.save_user_festival_record(
  bigint, bigint, date, text, text, bigint[]
) from authenticated;
drop function public.save_user_festival_record(
  bigint, bigint, date, text, text, bigint[]
);

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
        from unnest(v_attended_dates) as selected_date
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
  where user_festival_diary_id = v_record_id;

  insert into public.user_festival_performances (
    user_festival_diary_id, festival_artist_id
  )
  select v_record_id, fa.id
  from public.festival_artists fa
  where fa.festival_id = p_festival_id
    and fa.id = any(coalesce(p_festival_artist_ids, '{}'::bigint[]))
    and coalesce(fa.status, 'confirmed') <> 'cancelled';

  return v_record_id;
end;
$$;

revoke all on function public.save_user_festival_record(
  bigint, bigint, date[], text, text, bigint[]
) from public, anon;
grant execute on function public.save_user_festival_record(
  bigint, bigint, date[], text, text, bigint[]
) to authenticated;

commit;
