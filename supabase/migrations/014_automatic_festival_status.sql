-- Keep festival lifecycle statuses aligned with Korean calendar dates.
-- pg_cron uses GMT/UTC on hosted Supabase, so 15:05 UTC is 00:05 KST.

begin;

create extension if not exists pg_cron;

create or replace function public.refresh_festival_statuses()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := pg_catalog.timezone('Asia/Seoul', pg_catalog.now())::date;
  v_updated_count integer;
begin
  update public.festivals
  set status = case
    when end_date < v_today then 'ended'
    when start_date <= v_today and end_date >= v_today then 'ongoing'
    else 'scheduled'
  end
  where status is distinct from 'cancelled'
    and status is distinct from case
      when end_date < v_today then 'ended'
      when start_date <= v_today and end_date >= v_today then 'ongoing'
      else 'scheduled'
    end;

  get diagnostics v_updated_count = row_count;
  return v_updated_count;
end;
$$;

comment on function public.refresh_festival_statuses() is
  'Updates non-cancelled festival statuses from start/end dates using the Korean calendar date.';

revoke all on function public.refresh_festival_statuses() from public;

-- A named job is overwritten instead of duplicated when this migration is rerun.
select cron.schedule(
  'refresh-festival-statuses-kst',
  '5 15 * * *',
  $cron$select public.refresh_festival_statuses();$cron$
);

-- Align existing rows immediately instead of waiting for the next midnight run.
select public.refresh_festival_statuses();

commit;
