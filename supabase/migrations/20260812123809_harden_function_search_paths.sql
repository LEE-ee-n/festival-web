-- Pin the lookup path for public helper and trigger functions so that object
-- resolution cannot be influenced by a caller-controlled search_path.

begin;

alter function public.update_updated_at_column()
  set search_path = '';

alter function public.set_artist_normalized_name()
  set search_path = '';

alter function public.normalize_artist_name(text)
  set search_path = '';

alter function public.search_similar_artists(text)
  set search_path = '';

commit;
