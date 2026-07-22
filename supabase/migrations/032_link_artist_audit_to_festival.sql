begin;

create or replace function public.update_artist_from_festival_admin(
  p_festival_id bigint,
  p_artist_id bigint,
  p_name text,
  p_normalized_name text,
  p_aliases text[] default '{}'::text[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_festival_name text;
  v_result jsonb;
  v_event_id bigint;
begin
  if not public.is_admin() then
    raise exception '관리자 권한이 필요합니다.' using errcode = '42501';
  end if;

  select name into v_festival_name
  from public.festivals
  where id = p_festival_id;

  if not found then
    raise exception '축제를 찾을 수 없습니다.' using errcode = 'P0002';
  end if;

  v_result := public.update_artist_admin(
    p_artist_id,
    p_name,
    p_normalized_name,
    p_aliases
  );

  select id into v_event_id
  from public.audit_events
  where transaction_id = pg_catalog.txid_current()
    and actor_id is not distinct from auth.uid()
    and target_type = 'artist'
    and target_id = p_artist_id::text
  order by id desc
  limit 1;

  if v_event_id is null then
    raise exception '아티스트 변경 기록을 찾을 수 없습니다.' using errcode = 'P0002';
  end if;

  update public.audit_events
  set festival_id = p_festival_id,
      festival_name = v_festival_name
  where id = v_event_id;

  return v_result || pg_catalog.jsonb_build_object(
    'audit_event_id', v_event_id,
    'festival_id', p_festival_id
  );
end;
$$;

revoke all on function public.update_artist_from_festival_admin(
  bigint, bigint, text, text, text[]
) from public, anon;

grant execute on function public.update_artist_from_festival_admin(
  bigint, bigint, text, text, text[]
) to authenticated;

comment on function public.update_artist_from_festival_admin(
  bigint, bigint, text, text, text[]
) is 'Updates shared artist identity and links its audit event to the festival page where the change was made.';

commit;
