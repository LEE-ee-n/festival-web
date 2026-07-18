-- Calculate a festival lifecycle status immediately when relevant data changes.
-- The daily cron job in 014 remains as a safety reconciliation job.

begin;

create or replace function public.set_festival_status_from_dates()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_today date := pg_catalog.timezone('Asia/Seoul', pg_catalog.now())::date;
begin
  if new.status is distinct from 'cancelled' then
    new.status := case
      when new.end_date < v_today then 'ended'
      when new.start_date <= v_today and new.end_date >= v_today then 'ongoing'
      else 'scheduled'
    end;
  end if;

  return new;
end;
$$;

comment on function public.set_festival_status_from_dates() is
  'Sets a non-cancelled festival status from its dates using the Korean calendar date.';

revoke all on function public.set_festival_status_from_dates() from public;

drop trigger if exists set_festival_status_from_dates
on public.festivals;

create trigger set_festival_status_from_dates
before insert or update of start_date, end_date, status
on public.festivals
for each row
execute function public.set_festival_status_from_dates();

commit;
