-- Allow admins to change festivals.timetable_status after registration by
-- passing the optional key through the existing basic-info update RPC.

begin;

create or replace function public.update_festival_basic_info_with_audit(
  p_festival_id bigint,
  p_festival jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_name text;
  v_before public.festivals%rowtype;
  v_after public.festivals%rowtype;
  v_event_id bigint;
begin
  if not public.is_admin() then
    raise exception '관리자 권한이 필요합니다.' using errcode = '42501';
  end if;

  select coalesce(nullif(pg_catalog.btrim(display_name), ''), '관리자')
  into v_actor_name from public.profiles where id = v_actor_id;
  if v_actor_name is null then
    raise exception '관리자 프로필의 표시 이름을 확인해 주세요.' using errcode = '22023';
  end if;

  select * into v_before from public.festivals
  where id = p_festival_id for update;
  if not found then
    raise exception '수정할 축제를 찾을 수 없습니다.' using errcode = 'P0002';
  end if;

  update public.festivals set
    name = nullif(pg_catalog.btrim(p_festival->>'name'), ''),
    normalized_name = nullif(pg_catalog.btrim(p_festival->>'normalized_name'), ''),
    search_aliases = nullif(pg_catalog.btrim(p_festival->>'search_aliases'), ''),
    start_date = nullif(p_festival->>'start_date', '')::date,
    end_date = nullif(p_festival->>'end_date', '')::date,
    location = nullif(pg_catalog.btrim(p_festival->>'location'), ''),
    address = nullif(pg_catalog.btrim(p_festival->>'address'), ''),
    region = nullif(pg_catalog.btrim(p_festival->>'region'), ''),
    category = nullif(pg_catalog.btrim(p_festival->>'category'), ''),
    description = nullif(pg_catalog.btrim(p_festival->>'description'), ''),
    thumbnail_url = nullif(pg_catalog.btrim(p_festival->>'thumbnail_url'), ''),
    official_url = nullif(pg_catalog.btrim(p_festival->>'official_url'), ''),
    instagram_url = nullif(pg_catalog.btrim(p_festival->>'instagram_url'), ''),
    instagram_url_unavailable = case
      when p_festival ? 'instagram_url_unavailable'
        then coalesce((p_festival->>'instagram_url_unavailable')::boolean, false)
      else instagram_url_unavailable
    end,
    official_url_unavailable = case
      when p_festival ? 'official_url_unavailable'
        then coalesce((p_festival->>'official_url_unavailable')::boolean, false)
      else official_url_unavailable
    end,
    timetable_status = case
      when p_festival ? 'timetable_status' then
        case coalesce(pg_catalog.btrim(p_festival->>'timetable_status'), '')
          when 'unpublished' then 'unpublished'
          else 'published'
        end
      else timetable_status
    end,
    price_type = nullif(pg_catalog.btrim(p_festival->>'price_type'), ''),
    price_info = nullif(pg_catalog.btrim(p_festival->>'price_info'), ''),
    program_info = nullif(pg_catalog.btrim(p_festival->>'program_info'), ''),
    status = nullif(pg_catalog.btrim(p_festival->>'status'), ''),
    verification_status = coalesce(
      nullif(pg_catalog.btrim(p_festival->>'verification_status'), ''), 'pending'
    )
  where id = p_festival_id
  returning * into v_after;

  if (pg_catalog.to_jsonb(v_before) - 'updated_at')
     = (pg_catalog.to_jsonb(v_after) - 'updated_at') then
    return v_after.id;
  end if;

  insert into public.audit_events (
    actor_id, actor_name, action_type, festival_id, festival_name
  ) values (
    v_actor_id, v_actor_name, 'festival.updated', v_after.id, v_after.name
  ) returning id into v_event_id;

  insert into public.audit_changes (
    event_id, entity_type, entity_id, entity_label, operation, before_data, after_data
  ) values (
    v_event_id, 'festival', v_after.id::text, v_after.name,
    'update', pg_catalog.to_jsonb(v_before), pg_catalog.to_jsonb(v_after)
  );

  return v_after.id;
end;
$$;

commit;
