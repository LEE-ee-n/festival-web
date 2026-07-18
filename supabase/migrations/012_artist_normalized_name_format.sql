-- Restrict artists.normalized_name to lowercase ASCII letters and digits.
-- Abort instead of rewriting existing invalid data automatically.

begin;

do $$
begin
  if exists (
    select 1
    from public.artists
    where normalized_name is null
       or normalized_name !~ '^[a-z0-9]+$'
  ) then
    raise exception 'Invalid artists.normalized_name values exist. Fix them before applying this migration.';
  end if;
end;
$$;

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
  'Unique artist key. Lowercase ASCII letters and digits only; no spaces or punctuation.';

commit;
