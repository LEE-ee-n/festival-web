-- JSON 축제 등록 전체를 하나의 트랜잭션으로 처리한다.
-- 전제: 운영 DB에 public.import_festival_lineup(bigint, jsonb)이 존재한다.

begin;

create or replace function public.import_festival_json(
  p_festival jsonb,
  p_tickets jsonb,
  p_artists jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_festival_id bigint;
  v_name text;
  v_start_date date;
  v_end_date date;
  v_artists jsonb;
  v_lineup_result jsonb;
begin
  if not public.is_admin() then
    raise exception '관리자 권한이 필요합니다.'
      using errcode = '42501';
  end if;

  if p_festival is null
     or pg_catalog.jsonb_typeof(p_festival) <> 'object' then
    raise exception 'festival은 JSON 객체여야 합니다.'
      using errcode = '22023';
  end if;

  v_name := nullif(pg_catalog.btrim(p_festival->>'name'), '');
  v_start_date := nullif(p_festival->>'start_date', '')::date;
  v_end_date := nullif(p_festival->>'end_date', '')::date;

  if v_name is null or v_start_date is null or v_end_date is null then
    raise exception '축제명, 시작일, 종료일은 필수입니다.'
      using errcode = '22023';
  end if;

  if v_end_date < v_start_date then
    raise exception '종료일은 시작일보다 빠를 수 없습니다.'
      using errcode = '22023';
  end if;

  v_artists := coalesce(p_artists, '[]'::jsonb);

  if pg_catalog.jsonb_typeof(v_artists) <> 'array' then
    raise exception 'artists는 JSON 배열이어야 합니다.'
      using errcode = '22023';
  end if;

  if p_tickets is not null
     and pg_catalog.jsonb_typeof(p_tickets) <> 'array' then
    raise exception 'tickets는 JSON 배열이어야 합니다.'
      using errcode = '22023';
  end if;

  select festivals.id
  into v_festival_id
  from public.festivals
  where festivals.name = v_name
    and festivals.start_date = v_start_date
    and festivals.end_date = v_end_date
  order by festivals.id
  limit 1
  for update;

  if v_festival_id is null then
    insert into public.festivals (
      name,
      normalized_name,
      search_aliases,
      start_date,
      end_date,
      location,
      address,
      region,
      category,
      description,
      price_info,
      program_info,
      source_url,
      official_url,
      thumbnail_url,
      price_type,
      status,
      verification_status
    )
    values (
      v_name,
      nullif(p_festival->>'normalized_name', ''),
      nullif(p_festival->>'search_aliases', ''),
      v_start_date,
      v_end_date,
      nullif(p_festival->>'location', ''),
      nullif(p_festival->>'address', ''),
      nullif(p_festival->>'region', ''),
      nullif(p_festival->>'category', ''),
      nullif(p_festival->>'description', ''),
      nullif(p_festival->>'price_info', ''),
      nullif(p_festival->>'program_info', ''),
      nullif(p_festival->>'source_url', ''),
      nullif(p_festival->>'official_url', ''),
      nullif(p_festival->>'thumbnail_url', ''),
      nullif(p_festival->>'price_type', ''),
      coalesce(nullif(p_festival->>'status', ''), 'scheduled'),
      'approved'
    )
    returning id into v_festival_id;
  else
    update public.festivals
    set
      name = v_name,
      normalized_name = nullif(p_festival->>'normalized_name', ''),
      search_aliases = nullif(p_festival->>'search_aliases', ''),
      start_date = v_start_date,
      end_date = v_end_date,
      location = nullif(p_festival->>'location', ''),
      address = nullif(p_festival->>'address', ''),
      region = nullif(p_festival->>'region', ''),
      category = nullif(p_festival->>'category', ''),
      description = nullif(p_festival->>'description', ''),
      price_info = nullif(p_festival->>'price_info', ''),
      program_info = nullif(p_festival->>'program_info', ''),
      source_url = nullif(p_festival->>'source_url', ''),
      official_url = nullif(p_festival->>'official_url', ''),
      thumbnail_url = nullif(p_festival->>'thumbnail_url', ''),
      price_type = nullif(p_festival->>'price_type', ''),
      status = coalesce(
        nullif(p_festival->>'status', ''),
        'scheduled'
      ),
      verification_status = 'approved'
    where id = v_festival_id;
  end if;

  if p_tickets is not null then
    delete from public.festival_ticket_rounds
    where festival_id = v_festival_id;

    insert into public.festival_ticket_rounds (
      festival_id,
      round_type,
      round_name,
      open_at,
      price_info,
      ticket_url,
      ticket_platform
    )
    select
      v_festival_id,
      nullif(ticket.value->>'round_type', ''),
      coalesce(
        nullif(ticket.value->>'round_name', ''),
        '일반 예매'
      ),
      nullif(ticket.value->>'open_at', '')::timestamptz,
      nullif(ticket.value->>'price_info', ''),
      nullif(ticket.value->>'ticket_url', ''),
      nullif(ticket.value->>'ticket_platform', '')
    from pg_catalog.jsonb_array_elements(p_tickets) as ticket(value);
  end if;

  select pg_catalog.to_jsonb(
    public.import_festival_lineup(
      p_festival_id => v_festival_id,
      p_artists => v_artists
    )
  )
  into v_lineup_result;

  return v_lineup_result;
end;
$$;

revoke all
on function public.import_festival_json(jsonb, jsonb, jsonb)
from public;

revoke all
on function public.import_festival_json(jsonb, jsonb, jsonb)
from anon;

grant execute
on function public.import_festival_json(jsonb, jsonb, jsonb)
to authenticated;

commit;
