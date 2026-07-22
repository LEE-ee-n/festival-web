begin;

create or replace function public.delete_artist_admin(p_artist_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_artist public.artists%rowtype;
  v_lineup_count integer;
  v_event_id bigint;
begin
  if not public.is_admin() then
    raise exception '관리자 권한이 필요합니다.' using errcode = '42501';
  end if;

  select * into v_artist
  from public.artists
  where id = p_artist_id
  for update;
  if not found then
    raise exception '삭제할 아티스트를 찾을 수 없습니다.' using errcode = 'P0002';
  end if;

  select count(*)::integer into v_lineup_count
  from public.festival_artists
  where artist_id = p_artist_id;
  if v_lineup_count > 0 then
    raise exception '이 아티스트는 라인업 %건에 연결되어 있습니다. 연결된 라인업을 먼저 정리해 주세요.', v_lineup_count
      using errcode = '23503';
  end if;

  insert into public.audit_events (
    actor_id, actor_name, action_type, festival_name,
    target_type, target_id, target_label
  ) values (
    auth.uid(), public.audit_actor_name(), 'artist.deleted', null,
    'artist', v_artist.id::text, v_artist.name
  ) returning id into v_event_id;

  delete from public.artist_aliases where artist_id = p_artist_id;
  delete from public.artists where id = p_artist_id;

  return pg_catalog.jsonb_build_object(
    'artist_id', v_artist.id,
    'artist_name', v_artist.name,
    'audit_event_id', v_event_id
  );
end;
$$;

revoke all on function public.delete_artist_admin(bigint) from public, anon;
grant execute on function public.delete_artist_admin(bigint) to authenticated;

comment on function public.delete_artist_admin(bigint) is
  'Deletes an unlinked artist and aliases with an audit event; linked lineup rows must be removed first.';

commit;
