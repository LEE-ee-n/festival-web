begin;

alter function public.update_festival_statuses()
set search_path = '';

commit;
