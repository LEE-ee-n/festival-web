begin;

alter table public.audit_events
alter column festival_name drop not null;

alter table public.audit_events
add column if not exists target_type text,
add column if not exists target_id text,
add column if not exists target_label text,
add column if not exists transaction_id bigint not null default pg_catalog.txid_current();

update public.audit_events
set target_type = coalesce(target_type, 'festival'),
    target_id = coalesce(target_id, festival_id::text),
    target_label = coalesce(target_label, festival_name)
where target_type is null or target_id is null or target_label is null;

create index if not exists audit_events_transaction_idx
on public.audit_events (transaction_id, actor_id, id desc);

create or replace function public.audit_actor_name()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select nullif(pg_catalog.btrim(display_name), '') from public.profiles where id = auth.uid()),
    '시스템'
  );
$$;

create or replace function public.audit_artist_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id bigint;
  v_artist_id bigint := coalesce(new.id, old.id);
  v_label text := coalesce(new.name, old.name, '아티스트');
  v_operation text := case when tg_op = 'INSERT' then 'insert' when tg_op = 'UPDATE' then 'update' else 'delete' end;
begin
  if tg_op = 'UPDATE' and pg_catalog.to_jsonb(old) = pg_catalog.to_jsonb(new) then return new; end if;

  select id into v_event_id from public.audit_events
  where transaction_id = pg_catalog.txid_current()
    and actor_id is not distinct from auth.uid()
  order by id desc limit 1;

  if v_event_id is null then
    insert into public.audit_events (
      actor_id, actor_name, action_type, festival_name,
      target_type, target_id, target_label
    ) values (
      auth.uid(), public.audit_actor_name(),
      'artist.' || case v_operation when 'insert' then 'created' when 'update' then 'updated' else 'deleted' end,
      null, 'artist', v_artist_id::text, v_label
    ) returning id into v_event_id;
  end if;

  insert into public.audit_changes (
    event_id, entity_type, entity_id, entity_label, operation, before_data, after_data
  ) values (
    v_event_id, 'artist', v_artist_id::text, v_label, v_operation,
    case when tg_op = 'INSERT' then null else pg_catalog.to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else pg_catalog.to_jsonb(new) end
  );
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create or replace function public.audit_artist_alias_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id bigint;
  v_artist_id bigint := coalesce(new.artist_id, old.artist_id);
  v_alias_id bigint := coalesce(new.id, old.id);
  v_artist_name text;
  v_operation text := case when tg_op = 'INSERT' then 'insert' when tg_op = 'UPDATE' then 'update' else 'delete' end;
begin
  if tg_op = 'UPDATE' and pg_catalog.to_jsonb(old) = pg_catalog.to_jsonb(new) then return new; end if;
  select name into v_artist_name from public.artists where id = v_artist_id;
  v_artist_name := coalesce(v_artist_name, '삭제된 아티스트 #' || v_artist_id::text);

  select id into v_event_id from public.audit_events
  where transaction_id = pg_catalog.txid_current()
    and actor_id is not distinct from auth.uid()
  order by id desc limit 1;

  if v_event_id is null then
    insert into public.audit_events (
      actor_id, actor_name, action_type, festival_name,
      target_type, target_id, target_label
    ) values (
      auth.uid(), public.audit_actor_name(), 'artist.alias_changed', null,
      'artist', v_artist_id::text, v_artist_name
    ) returning id into v_event_id;
  end if;

  insert into public.audit_changes (
    event_id, entity_type, entity_id, entity_label, operation, before_data, after_data
  ) values (
    v_event_id, 'artist_alias', v_alias_id::text, v_artist_name, v_operation,
    case when tg_op = 'INSERT' then null else pg_catalog.to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else pg_catalog.to_jsonb(new) end
  );
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists audit_artist_changes on public.artists;
create trigger audit_artist_changes
after insert or update or delete on public.artists
for each row execute function public.audit_artist_row_change();

drop trigger if exists audit_artist_alias_changes on public.artist_aliases;
create trigger audit_artist_alias_changes
after insert or update or delete on public.artist_aliases
for each row execute function public.audit_artist_alias_row_change();

create or replace function public.create_artist_with_audit(
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
  v_artist public.artists%rowtype;
  v_alias text;
  v_normalized_alias text;
  v_event_id bigint;
begin
  if not public.is_admin() then raise exception '관리자 권한이 필요합니다.' using errcode = '42501'; end if;
  if nullif(pg_catalog.btrim(p_name), '') is null or pg_catalog.btrim(p_normalized_name) !~ '^[a-z0-9]+$' then
    raise exception '아티스트 이름과 normalized_name을 확인해 주세요.' using errcode = '22023';
  end if;

  insert into public.audit_events (
    actor_id, actor_name, action_type, festival_name, target_type, target_id, target_label
  ) values (
    auth.uid(), public.audit_actor_name(), 'artist.created', null,
    'artist', null, pg_catalog.btrim(p_name)
  ) returning id into v_event_id;

  insert into public.artists (name, normalized_name)
  values (pg_catalog.btrim(p_name), pg_catalog.btrim(p_normalized_name))
  returning * into v_artist;

  update public.audit_events set target_id = v_artist.id::text where id = v_event_id;

  for v_alias in select distinct pg_catalog.btrim(value) from pg_catalog.unnest(coalesce(p_aliases, '{}'::text[])) value
    where nullif(pg_catalog.btrim(value), '') is not null
  loop
    v_normalized_alias := public.normalize_artist_name(v_alias);
    insert into public.artist_aliases (artist_id, alias_name, normalized_alias)
    values (v_artist.id, v_alias, coalesce(nullif(v_normalized_alias, ''), v_artist.normalized_name));
  end loop;

  return pg_catalog.jsonb_build_object(
    'id', v_artist.id, 'name', v_artist.name,
    'normalized_name', v_artist.normalized_name, 'aliases', coalesce(p_aliases, '{}'::text[])
  );
end;
$$;

create or replace function public.update_artist_admin(
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
  v_before public.artists%rowtype;
  v_name text := nullif(pg_catalog.btrim(p_name), '');
  v_normalized_name text := pg_catalog.btrim(p_normalized_name);
  v_alias text;
  v_normalized_alias text;
  v_event_id bigint;
  v_old_aliases text[];
  v_new_aliases text[];
begin
  if not public.is_admin() then raise exception '관리자 권한이 필요합니다.' using errcode = '42501'; end if;
  if v_name is null or v_normalized_name !~ '^[a-z0-9]+$' then
    raise exception '아티스트 이름과 normalized_name을 확인해 주세요.' using errcode = '22023';
  end if;

  select * into v_before from public.artists where id = p_artist_id for update;
  if not found then raise exception '아티스트를 찾을 수 없습니다.' using errcode = 'P0002'; end if;

  if exists (select 1 from public.artists where normalized_name = v_normalized_name and id <> p_artist_id) then
    raise exception '같은 normalized_name을 사용하는 아티스트가 있습니다.' using errcode = '23505';
  end if;
  if exists (
    select 1 from public.artist_aliases aa
    join pg_catalog.unnest(coalesce(p_aliases, '{}'::text[])) input_alias(alias_name)
      on pg_catalog.lower(pg_catalog.btrim(aa.alias_name)) = pg_catalog.lower(pg_catalog.btrim(input_alias.alias_name))
    where aa.artist_id <> p_artist_id and nullif(pg_catalog.btrim(input_alias.alias_name), '') is not null
  ) then raise exception '입력한 별칭이 다른 아티스트에 등록되어 있습니다.' using errcode = '23505'; end if;

  insert into public.audit_events (
    actor_id, actor_name, action_type, festival_name, target_type, target_id, target_label
  ) values (
    auth.uid(), public.audit_actor_name(), 'artist.updated', null,
    'artist', p_artist_id::text, v_before.name
  ) returning id into v_event_id;

  select coalesce(pg_catalog.array_agg(alias_name order by pg_catalog.lower(alias_name)), '{}'::text[])
  into v_old_aliases from public.artist_aliases where artist_id = p_artist_id;
  select coalesce(pg_catalog.array_agg(alias_name order by pg_catalog.lower(alias_name)), '{}'::text[])
  into v_new_aliases from (
    select distinct pg_catalog.btrim(value) as alias_name
    from pg_catalog.unnest(coalesce(p_aliases, '{}'::text[])) value
    where nullif(pg_catalog.btrim(value), '') is not null
  ) normalized_input;

  if v_before.name is distinct from v_name or v_before.normalized_name is distinct from v_normalized_name then
    update public.artists set name = v_name, normalized_name = v_normalized_name where id = p_artist_id;
  end if;

  if v_old_aliases is distinct from v_new_aliases then
    delete from public.artist_aliases where artist_id = p_artist_id;

    for v_alias in select pg_catalog.unnest(v_new_aliases)
    loop
      v_normalized_alias := public.normalize_artist_name(v_alias);
      insert into public.artist_aliases (artist_id, alias_name, normalized_alias)
      values (p_artist_id, v_alias, coalesce(nullif(v_normalized_alias, ''), v_normalized_name));
    end loop;
  end if;

  if not exists (select 1 from public.audit_changes where event_id = v_event_id) then
    raise exception '실제로 변경된 아티스트 정보가 없습니다.' using errcode = '22023';
  end if;

  return pg_catalog.jsonb_build_object(
    'id', p_artist_id, 'name', v_name,
    'normalized_name', v_normalized_name, 'aliases', coalesce(p_aliases, '{}'::text[])
  );
end;
$$;

revoke all on function public.audit_actor_name() from public, anon, authenticated;
revoke all on function public.create_artist_with_audit(text, text, text[]) from public, anon;
revoke all on function public.update_artist_admin(bigint, text, text, text[]) from public, anon;
grant execute on function public.create_artist_with_audit(text, text, text[]) to authenticated;
grant execute on function public.update_artist_admin(bigint, text, text, text[]) to authenticated;

commit;
