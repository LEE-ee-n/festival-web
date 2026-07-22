-- Keep artist identity fixed by artists.normalized_name.
-- An alias may not equal another artist's official normalized_name or alias.

begin;

create or replace function public.enforce_artist_alias_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_normalized_alias text := public.normalize_artist_name(new.alias_name);
begin
  if v_normalized_alias = '' then
    raise exception '별칭을 정규화한 값이 비어 있습니다.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.artists a
    where a.id <> new.artist_id
      and a.normalized_name = v_normalized_alias
  ) then
    raise exception '별칭 %은(는) 다른 아티스트의 normalized_name입니다.', new.alias_name
      using errcode = '23505';
  end if;

  if exists (
    select 1
    from public.artist_aliases aa
    where aa.artist_id <> new.artist_id
      and aa.normalized_alias = v_normalized_alias
  ) then
    raise exception '별칭 %은(는) 다른 아티스트에 연결되어 있습니다.', new.alias_name
      using errcode = '23505';
  end if;

  new.normalized_alias := v_normalized_alias;
  return new;
end;
$$;

drop trigger if exists protect_artist_alias_identity on public.artist_aliases;
create trigger protect_artist_alias_identity
before insert or update on public.artist_aliases
for each row execute function public.enforce_artist_alias_identity();

revoke all on function public.enforce_artist_alias_identity() from public, anon, authenticated;

commit;
