alter table public.user_festival_diaries
  drop constraint if exists user_festival_diaries_summary_length;

alter table public.user_festival_diaries
  add constraint user_festival_diaries_summary_length
  check (
    summary is null
    or char_length(pg_catalog.btrim(summary)) between 1 and 5000
  );
