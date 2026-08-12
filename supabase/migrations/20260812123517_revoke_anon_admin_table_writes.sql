-- Keep public reads available through existing RLS policies, but prevent the
-- anonymous API role from attempting administrative table mutations.

begin;

revoke insert, update, delete, truncate, references, trigger
on table
  public.pipeline_runs,
  public.festivals,
  public.artist_aliases,
  public.festival_ticket_rounds,
  public.festival_artists,
  public.festival_update_drafts,
  public.artists
from anon;

commit;
