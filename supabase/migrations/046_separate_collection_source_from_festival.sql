begin;

create or replace function public.clear_candidate_source_from_new_festival()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.source_url is not null
     and exists (
       select 1
       from public.festival_candidates c
       where c.status = 'pending'
         and c.source_url = new.source_url
     ) then
    new.source_url := null;
  end if;

  return new;
end;
$$;

drop trigger if exists clear_candidate_source_from_new_festival
on public.festivals;

create trigger clear_candidate_source_from_new_festival
before insert on public.festivals
for each row execute function public.clear_candidate_source_from_new_festival();

revoke all on function public.clear_candidate_source_from_new_festival()
from public, anon, authenticated;

comment on function public.clear_candidate_source_from_new_festival() is
  'Keeps a collection post URL on its candidate and audit event instead of copying it into festivals.source_url.';

commit;
