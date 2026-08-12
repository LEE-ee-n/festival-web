-- Keep extension-owned objects outside the API-exposed public schema.

begin;

create schema if not exists extensions;

revoke create on schema extensions from public, anon, authenticated;
grant usage on schema extensions to anon, authenticated;

alter extension pg_trgm set schema extensions;

alter function public.search_similar_artists(text)
  set search_path = pg_catalog, extensions;

commit;
