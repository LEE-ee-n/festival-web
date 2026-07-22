begin;

create or replace function public.apply_completed_candidate_metadata()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'approved'
     and old.status is distinct from 'approved'
     and new.festival_id is not null then
    update public.festivals
    set timetable_status = case
      when old.draft_json->'workflow'->>'timetable_visibility' = 'unpublished'
        then 'unpublished'
      else 'published'
    end
    where id = new.festival_id;

    if old.work_type = 'new' then
      update public.festival_artists fa
      set input_name = nullif(pg_catalog.btrim(item.value->>'input_name'), '')
      from pg_catalog.jsonb_array_elements(
        coalesce(old.draft_json->'artists', '[]'::jsonb)
      ) as item(value)
      join public.artists a
        on a.normalized_name = item.value->>'normalized_name'
      where fa.festival_id = new.festival_id
        and fa.artist_id = a.id
        and fa.input_name is null
        and coalesce(item.value->>'match_status', '') <> 'excluded';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists apply_completed_candidate_metadata
on public.festival_candidates;

create trigger apply_completed_candidate_metadata
after update of status on public.festival_candidates
for each row execute function public.apply_completed_candidate_metadata();

revoke all on function public.apply_completed_candidate_metadata()
from public, anon, authenticated;

commit;
