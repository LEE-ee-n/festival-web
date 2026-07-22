begin;

alter table public.audit_events
add column if not exists note text;

create or replace function public.change_festival_ticket_with_audit(
  p_festival_id bigint,
  p_operation text,
  p_ticket_id bigint default null,
  p_ticket jsonb default '{}'::jsonb,
  p_source_url text default null,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_name text;
  v_festival public.festivals%rowtype;
  v_ticket public.festival_ticket_rounds%rowtype;
  v_before jsonb;
  v_after jsonb;
  v_event_id bigint;
begin
  if not public.is_admin() then
    raise exception '관리자 권한이 필요합니다.' using errcode = '42501';
  end if;
  if p_operation not in ('insert', 'update', 'delete') then
    raise exception '지원하지 않는 티켓 작업입니다.' using errcode = '22023';
  end if;

  select * into v_festival from public.festivals
  where id = p_festival_id for update;
  if not found then raise exception '축제를 찾을 수 없습니다.' using errcode = 'P0002'; end if;

  select coalesce(nullif(pg_catalog.btrim(display_name), ''), '관리자')
  into v_actor_name from public.profiles where id = v_actor_id;
  if v_actor_name is null then raise exception '관리자 표시 이름이 필요합니다.' using errcode = '22023'; end if;

  if p_operation in ('update', 'delete') then
    select * into v_ticket from public.festival_ticket_rounds
    where id = p_ticket_id and festival_id = p_festival_id for update;
    if not found then raise exception '티켓을 찾을 수 없습니다.' using errcode = 'P0002'; end if;
    v_before := pg_catalog.to_jsonb(v_ticket);
  end if;

  if p_operation = 'insert' then
    if nullif(pg_catalog.btrim(p_ticket->>'round_name'), '') is null
       or nullif(p_ticket->>'open_at', '') is null then
      raise exception '티켓명과 예매 시각은 필수입니다.' using errcode = '22023';
    end if;
    insert into public.festival_ticket_rounds (
      festival_id, round_type, round_name, open_at, price_info, ticket_url, ticket_platform
    ) values (
      p_festival_id, nullif(pg_catalog.btrim(p_ticket->>'round_type'), ''),
      pg_catalog.btrim(p_ticket->>'round_name'), (p_ticket->>'open_at')::timestamptz,
      nullif(pg_catalog.btrim(p_ticket->>'price_info'), ''),
      nullif(pg_catalog.btrim(p_ticket->>'ticket_url'), ''),
      nullif(pg_catalog.btrim(p_ticket->>'ticket_platform'), '')
    ) returning * into v_ticket;
    v_after := pg_catalog.to_jsonb(v_ticket);
  elsif p_operation = 'update' then
    update public.festival_ticket_rounds set
      round_type = nullif(pg_catalog.btrim(p_ticket->>'round_type'), ''),
      round_name = coalesce(nullif(pg_catalog.btrim(p_ticket->>'round_name'), ''), round_name),
      open_at = nullif(p_ticket->>'open_at', '')::timestamptz,
      price_info = nullif(pg_catalog.btrim(p_ticket->>'price_info'), ''),
      ticket_url = nullif(pg_catalog.btrim(p_ticket->>'ticket_url'), ''),
      ticket_platform = nullif(pg_catalog.btrim(p_ticket->>'ticket_platform'), '')
    where id = p_ticket_id returning * into v_ticket;
    v_after := pg_catalog.to_jsonb(v_ticket);
    if v_before = v_after then raise exception '실제로 변경된 티켓 값이 없습니다.' using errcode = '22023'; end if;
  else
    delete from public.festival_ticket_rounds where id = p_ticket_id;
  end if;

  insert into public.audit_events (
    actor_id, actor_name, action_type, festival_id, festival_name, source_url, note
  ) values (
    v_actor_id, v_actor_name, 'ticket.' ||
      case p_operation when 'insert' then 'created' when 'update' then 'updated' else 'deleted' end,
    v_festival.id, v_festival.name, nullif(pg_catalog.btrim(p_source_url), ''),
    nullif(pg_catalog.btrim(p_note), '')
  ) returning id into v_event_id;

  insert into public.audit_changes (
    event_id, entity_type, entity_id, entity_label, operation, before_data, after_data
  ) values (
    v_event_id, 'festival_ticket_round', v_ticket.id::text, v_ticket.round_name,
    p_operation, v_before, v_after
  );

  return pg_catalog.jsonb_build_object('event_id', v_event_id, 'ticket', pg_catalog.to_jsonb(v_ticket));
end;
$$;

create or replace function public.change_festival_thumbnail_with_audit(
  p_festival_id bigint,
  p_new_url text,
  p_source_url text default null,
  p_note text default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_name text;
  v_festival public.festivals%rowtype;
  v_old_url text;
  v_new_url text := nullif(pg_catalog.btrim(p_new_url), '');
  v_event_id bigint;
begin
  if not public.is_admin() then
    raise exception '관리자 권한이 필요합니다.' using errcode = '42501';
  end if;
  select * into v_festival from public.festivals
  where id = p_festival_id for update;
  if not found then raise exception '축제를 찾을 수 없습니다.' using errcode = 'P0002'; end if;

  v_old_url := v_festival.thumbnail_url;
  if v_old_url is not distinct from v_new_url then
    raise exception '실제로 변경된 썸네일 URL이 없습니다.' using errcode = '22023';
  end if;

  select coalesce(nullif(pg_catalog.btrim(display_name), ''), '관리자')
  into v_actor_name from public.profiles where id = v_actor_id;
  if v_actor_name is null then raise exception '관리자 표시 이름이 필요합니다.' using errcode = '22023'; end if;

  update public.festivals set thumbnail_url = v_new_url where id = p_festival_id;

  insert into public.audit_events (
    actor_id, actor_name, action_type, festival_id, festival_name, source_url, note
  ) values (
    v_actor_id, v_actor_name,
    case when v_old_url is null then 'thumbnail.uploaded'
      when v_new_url is null then 'thumbnail.deleted' else 'thumbnail.replaced' end,
    v_festival.id, v_festival.name, nullif(pg_catalog.btrim(p_source_url), ''),
    nullif(pg_catalog.btrim(p_note), '')
  ) returning id into v_event_id;

  insert into public.audit_changes (
    event_id, entity_type, entity_id, entity_label, operation, before_data, after_data
  ) values (
    v_event_id, 'festival_thumbnail', v_festival.id::text, v_festival.name,
    case when v_old_url is null then 'insert' when v_new_url is null then 'delete' else 'update' end,
    case when v_old_url is null then null else pg_catalog.jsonb_build_object('thumbnail_url', v_old_url) end,
    case when v_new_url is null then null else pg_catalog.jsonb_build_object('thumbnail_url', v_new_url) end
  );
  return v_event_id;
end;
$$;

revoke all on function public.change_festival_ticket_with_audit(bigint, text, bigint, jsonb, text, text) from public, anon;
revoke all on function public.change_festival_thumbnail_with_audit(bigint, text, text, text) from public, anon;
grant execute on function public.change_festival_ticket_with_audit(bigint, text, bigint, jsonb, text, text) to authenticated;
grant execute on function public.change_festival_thumbnail_with_audit(bigint, text, text, text) to authenticated;

commit;
