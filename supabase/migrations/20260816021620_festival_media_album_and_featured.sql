alter table public.user_festival_media
  add column if not exists user_festival_diary_id bigint,
  add column if not exists featured_image_order smallint,
  add column if not exists is_featured_video boolean not null default false;

update public.user_festival_media media
set user_festival_diary_id = performance.user_festival_diary_id
from public.user_festival_performances performance
where performance.id = media.user_festival_performance_id
  and media.user_festival_diary_id is null;

alter table public.user_festival_media
  alter column user_festival_diary_id set not null,
  alter column user_festival_performance_id drop not null;

alter table public.user_festival_media
  drop constraint if exists user_festival_media_user_festival_diary_id_fkey,
  add constraint user_festival_media_user_festival_diary_id_fkey
    foreign key (user_festival_diary_id)
    references public.user_festival_diaries(id)
    on delete cascade,
  drop constraint if exists user_festival_media_featured_image_order_check,
  add constraint user_festival_media_featured_image_order_check
    check (featured_image_order between 1 and 4),
  drop constraint if exists user_festival_media_featured_image_type_check,
  add constraint user_festival_media_featured_image_type_check
    check (featured_image_order is null or file_type = 'image'),
  drop constraint if exists user_festival_media_featured_video_type_check,
  add constraint user_festival_media_featured_video_type_check
    check (not is_featured_video or file_type = 'video');

create unique index if not exists user_festival_media_general_file_unique
  on public.user_festival_media (user_festival_diary_id, provider, external_file_id)
  where user_festival_performance_id is null
    and external_file_id is not null;

create unique index if not exists user_festival_media_featured_image_order_unique
  on public.user_festival_media (user_festival_diary_id, featured_image_order)
  where featured_image_order is not null;

create unique index if not exists user_festival_media_featured_video_unique
  on public.user_festival_media (user_festival_diary_id)
  where is_featured_video;

drop policy if exists "users manage own festival media" on public.user_festival_media;

create policy "users manage own festival media"
on public.user_festival_media
for all
to authenticated
using (
  exists (
    select 1
    from public.user_festival_diaries diary
    where diary.id = user_festival_media.user_festival_diary_id
      and diary.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.user_festival_diaries diary
    where diary.id = user_festival_media.user_festival_diary_id
      and diary.user_id = (select auth.uid())
  )
  and (
    user_festival_media.user_festival_performance_id is null
    or exists (
      select 1
      from public.user_festival_performances performance
      where performance.id = user_festival_media.user_festival_performance_id
        and performance.user_festival_diary_id = user_festival_media.user_festival_diary_id
    )
  )
);

create or replace function public.set_user_festival_media_featured(
  p_media_id bigint,
  p_featured boolean
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_media public.user_festival_media%rowtype;
  v_order smallint;
begin
  if (select auth.uid()) is null then
    raise exception '로그인이 필요합니다.' using errcode = '42501';
  end if;

  select *
  into v_media
  from public.user_festival_media
  where id = p_media_id;

  if not found then
    raise exception '미디어를 찾을 수 없거나 수정 권한이 없습니다.' using errcode = '42501';
  end if;

  if v_media.file_type = 'image' then
    if not p_featured then
      update public.user_festival_media
      set featured_image_order = null
      where id = p_media_id;
      v_order := null;
    elsif v_media.featured_image_order is not null then
      v_order := v_media.featured_image_order;
    else
      select slot::smallint
      into v_order
      from generate_series(1, 4) slot
      where not exists (
        select 1
        from public.user_festival_media existing
        where existing.user_festival_diary_id = v_media.user_festival_diary_id
          and existing.featured_image_order = slot
      )
      order by slot
      limit 1;

      if v_order is null then
        raise exception '대표 사진은 최대 4장까지 선택할 수 있습니다.' using errcode = '22023';
      end if;

      update public.user_festival_media
      set featured_image_order = v_order
      where id = p_media_id;
    end if;
  elsif v_media.file_type = 'video' then
    if p_featured then
      update public.user_festival_media
      set is_featured_video = false
      where user_festival_diary_id = v_media.user_festival_diary_id
        and is_featured_video;
    end if;

    update public.user_festival_media
    set is_featured_video = p_featured
    where id = p_media_id;
  else
    raise exception '지원하지 않는 미디어 형식입니다.' using errcode = '22023';
  end if;

  return jsonb_build_object(
    'featuredImageOrder', v_order,
    'isFeaturedVideo', case when v_media.file_type = 'video' then p_featured else false end
  );
end;
$$;

revoke all on function public.set_user_festival_media_featured(bigint, boolean) from public, anon;
grant execute on function public.set_user_festival_media_featured(bigint, boolean) to authenticated;

grant select, insert, update, delete on table public.user_festival_media to authenticated;
