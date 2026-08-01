begin;

alter table public.festivals
add column if not exists calendar_color text;

alter table public.festivals
drop constraint if exists festivals_calendar_color_check,
add constraint festivals_calendar_color_check check (
  calendar_color is null
  or calendar_color in ('pink', 'blue', 'green', 'purple', 'orange')
);

comment on column public.festivals.calendar_color is
  '관리자가 지정한 캘린더 막대 색상. null이면 축제 ID 기반 자동 색상';

create or replace function public.update_festival_calendar_color_with_audit(
  p_festival_id bigint,
  p_calendar_color text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_name text;
  v_calendar_color text := nullif(pg_catalog.btrim(p_calendar_color), '');
  v_before public.festivals%rowtype;
  v_after public.festivals%rowtype;
  v_event_id bigint;
begin
  if not public.is_admin() then
    raise exception '관리자 권한이 필요합니다.' using errcode = '42501';
  end if;

  if v_calendar_color is not null
     and v_calendar_color not in ('pink', 'blue', 'green', 'purple', 'orange') then
    raise exception '허용되지 않은 캘린더 색상입니다.' using errcode = '22023';
  end if;

  select coalesce(nullif(pg_catalog.btrim(display_name), ''), '관리자')
  into v_actor_name
  from public.profiles
  where id = v_actor_id;

  if v_actor_name is null then
    raise exception '관리자 프로필의 표시 이름을 확인해 주세요.' using errcode = '22023';
  end if;

  select * into v_before
  from public.festivals
  where id = p_festival_id
  for update;

  if not found then
    raise exception '수정할 축제를 찾을 수 없습니다.' using errcode = 'P0002';
  end if;

  if v_before.calendar_color is not distinct from v_calendar_color then
    return v_before.calendar_color;
  end if;

  update public.festivals
  set calendar_color = v_calendar_color
  where id = p_festival_id
  returning * into v_after;

  insert into public.audit_events (
    actor_id, actor_name, action_type, festival_id, festival_name
  ) values (
    v_actor_id, v_actor_name, 'festival.updated', v_after.id, v_after.name
  ) returning id into v_event_id;

  insert into public.audit_changes (
    event_id, entity_type, entity_id, entity_label, operation,
    before_data, after_data
  ) values (
    v_event_id, 'festival', v_after.id::text, v_after.name, 'update',
    pg_catalog.to_jsonb(v_before), pg_catalog.to_jsonb(v_after)
  );

  return v_after.calendar_color;
end;
$$;

revoke all on function public.update_festival_calendar_color_with_audit(bigint, text)
from public, anon;

grant execute on function public.update_festival_calendar_color_with_audit(bigint, text)
to authenticated;

comment on function public.update_festival_calendar_color_with_audit(bigint, text) is
  '관리자가 축제 캘린더 색상을 즉시 변경하고 감사 로그를 남긴다';

commit;
