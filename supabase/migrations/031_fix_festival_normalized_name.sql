-- Keep festival identity stable across yearly festival names.
-- Example: "2026 ONE UNIVERSE FESTIVAL" -> "oneuniverse"

begin;

create or replace function public.normalize_festival_name(
  p_name text,
  p_start_date date default null
)
returns text
language sql
immutable
set search_path to ''
as $$
  select pg_catalog.regexp_replace(
    pg_catalog.regexp_replace(
      pg_catalog.regexp_replace(
        pg_catalog.lower(coalesce(p_name, '')),
        '20[0-9]{2}',
        '',
        'g'
      ),
      'festival',
      '',
      'g'
    ),
    '[^a-z0-9]',
    '',
    'g'
  );
$$;

comment on function public.normalize_festival_name(text, date) is
  'Removes 20XX and festival, then keeps lowercase ASCII letters and digits. The date argument remains for signature compatibility and is not included in normalized_name.';

commit;
