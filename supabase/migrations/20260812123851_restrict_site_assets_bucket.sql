-- Site assets currently contain image files only. Apply the same defensive
-- upload boundary used by the public festival thumbnail bucket.

begin;

update storage.buckets
set
  file_size_limit = 5242880,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml'
  ]::text[]
where id = 'site-assets';

commit;
