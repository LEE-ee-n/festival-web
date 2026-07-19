-- Require one valid, unique normalized_name for every artist.
-- Existing production data must be reviewed before this migration is applied.

begin;

do $$
begin
  if exists (
    select 1
    from public.artists
    where nullif(pg_catalog.btrim(normalized_name), '') is null
       or pg_catalog.btrim(normalized_name) !~ '^[a-z0-9]+$'
  ) then
    raise exception 'Invalid or empty artists.normalized_name values exist.';
  end if;

  if exists (
    select 1
    from public.artists
    group by pg_catalog.btrim(normalized_name)
    having count(*) > 1
  ) then
    raise exception 'Duplicate artists.normalized_name values exist.';
  end if;
end;
$$;

update public.artists
set normalized_name = pg_catalog.btrim(normalized_name)
where normalized_name <> pg_catalog.btrim(normalized_name);

alter table public.artists
  alter column normalized_name set not null;

alter table public.artists
  drop constraint if exists artists_normalized_name_format;

alter table public.artists
  add constraint artists_normalized_name_format
  check (normalized_name ~ '^[a-z0-9]+$');

drop index if exists public.artists_normalized_name_unique;

create unique index artists_normalized_name_unique
on public.artists (normalized_name);

comment on column public.artists.normalized_name is
  'Required unique artist key. Lowercase ASCII letters and digits only.';

commit;
