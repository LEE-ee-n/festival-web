-- Atomically update one artist and replace its aliases.

create or replace function public.update_artist_admin(
  p_artist_id bigint,
  p_name text,
  p_normalized_name text,
  p_aliases text[] default '{}'::text[]
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_name text := nullif(pg_catalog.btrim(p_name), '');
  v_normalized_name text := pg_catalog.btrim(p_normalized_name);
  v_alias text;
  v_normalized_alias text;
begin
  if not public.is_admin() then
    raise exception '관리자 권한이 필요합니다.' using errcode = '42501';
  end if;

  if v_name is null then
    raise exception '화면 표시 이름이 필요합니다.' using errcode = '22023';
  end if;

  if v_normalized_name !~ '^[a-z0-9]+$' then
    raise exception 'normalized_name은 영문 소문자와 숫자만 허용됩니다.'
      using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.artists where id = p_artist_id
  ) then
    raise exception '아티스트를 찾을 수 없습니다.' using errcode = 'P0002';
  end if;

  if exists (
    select 1
    from public.artists
    where normalized_name = v_normalized_name
      and id <> p_artist_id
  ) then
    raise exception '같은 normalized_name을 사용하는 아티스트가 있습니다.'
      using errcode = '23505';
  end if;

  if exists (
    select 1
    from public.artist_aliases existing_alias
    join pg_catalog.unnest(coalesce(p_aliases, '{}'::text[]))
      as input_alias(alias_name)
      on pg_catalog.lower(pg_catalog.btrim(existing_alias.alias_name))
        = pg_catalog.lower(pg_catalog.btrim(input_alias.alias_name))
    where existing_alias.artist_id <> p_artist_id
      and nullif(pg_catalog.btrim(input_alias.alias_name), '') is not null
  ) then
    raise exception '입력한 별칭이 다른 아티스트에 등록되어 있습니다.'
      using errcode = '23505';
  end if;

  update public.artists
  set name = v_name,
      normalized_name = v_normalized_name
  where id = p_artist_id;

  delete from public.artist_aliases
  where artist_id = p_artist_id;

  for v_alias in
    select distinct pg_catalog.btrim(input_alias.alias_name)
    from pg_catalog.unnest(coalesce(p_aliases, '{}'::text[]))
      as input_alias(alias_name)
    where nullif(pg_catalog.btrim(input_alias.alias_name), '') is not null
  loop
    v_normalized_alias := pg_catalog.regexp_replace(
      pg_catalog.replace(pg_catalog.lower(v_alias), '&', 'and'),
      '[^a-z0-9]',
      '',
      'g'
    );

    insert into public.artist_aliases (
      artist_id,
      alias_name,
      normalized_alias
    )
    values (
      p_artist_id,
      v_alias,
      coalesce(nullif(v_normalized_alias, ''), v_normalized_name)
    );
  end loop;

  return pg_catalog.jsonb_build_object(
    'id', p_artist_id,
    'name', v_name,
    'normalized_name', v_normalized_name,
    'aliases', coalesce(p_aliases, '{}'::text[])
  );
end;
$$;

revoke all on function public.update_artist_admin(bigint, text, text, text[])
from public;

grant execute on function public.update_artist_admin(bigint, text, text, text[])
to authenticated;
