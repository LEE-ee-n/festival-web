-- Candidate posters are private but still need an upload boundary to prevent
-- oversized or unexpected files from being stored by the ingestion bot.

begin;

update storage.buckets
set
  file_size_limit = 5242880,
  allowed_mime_types = array[
    'image/png',
    'image/webp'
  ]::text[]
where id = 'festival-candidate-posters';

commit;
