-- Publicly served SVG files may contain active content. Site assets currently
-- use raster images, so keep the bucket limited to safe raster formats.

begin;

update storage.buckets
set allowed_mime_types = array[
  'image/jpeg',
  'image/png',
  'image/webp'
]::text[]
where id = 'site-assets';

commit;
