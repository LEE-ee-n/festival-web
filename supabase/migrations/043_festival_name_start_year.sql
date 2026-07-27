-- Keep every published festival display name aligned with its start year.
-- Example: start_date 2026-07-25 + "ONE UNIVERSE 페스티벌"
--       -> "2026 ONE UNIVERSE 페스티벌"

begin;

create or replace function public.format_festival_display_name(
  p_name text,
  p_start_date date
)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when nullif(pg_catalog.btrim(coalesce(p_name, '')), '') is null
      or p_start_date is null
      then pg_catalog.btrim(coalesce(p_name, ''))
    else pg_catalog.concat(
      pg_catalog.to_char(p_start_date, 'YYYY'),
      ' ',
      pg_catalog.btrim(
        pg_catalog.regexp_replace(
          pg_catalog.btrim(p_name),
          '^20[0-9]{2}[[:space:]]+',
          ''
        )
      )
    )
  end;
$$;

create or replace function public.set_festival_name_start_year()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.name := public.format_festival_display_name(
    new.name,
    new.start_date
  );
  return new;
end;
$$;

drop trigger if exists set_festival_name_start_year
  on public.festivals;

create trigger set_festival_name_start_year
before insert or update on public.festivals
for each row
execute function public.set_festival_name_start_year();

alter table public.festivals
  drop constraint if exists festivals_name_start_year_check;

alter table public.festivals
  add constraint festivals_name_start_year_check
  check (
    pg_catalog.btrim(name) ~ '^20[0-9]{2}[[:space:]]+.+$'
    and pg_catalog.left(pg_catalog.btrim(name), 4)
      = pg_catalog.to_char(start_date, 'YYYY')
  );

comment on function public.format_festival_display_name(text, date) is
  'Prefixes a festival display name with the year from start_date while preserving normalized_name.';

comment on constraint festivals_name_start_year_check
  on public.festivals is
  'Festival name must begin with the same 20XX year as start_date.';

commit;
