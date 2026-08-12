-- pg_trgm is currently installed in public, so the artist similarity search
-- must include public in its pinned path. CREATE on public is revoked from
-- PUBLIC, anon, and authenticated, preventing caller-controlled shadowing.

begin;

alter function public.search_similar_artists(text)
  set search_path = pg_catalog, public;

commit;
