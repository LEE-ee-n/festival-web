-- Backfill approved candidate history for festivals created before the workspace.
-- Existing festival, lineup, and ticket rows are not modified.

with target_festivals as (
  select f.*
  from public.festivals f
  where f.id in (2, 3, 4, 16, 28)
    and not exists (
      select 1
      from public.festival_candidates fc
      where fc.festival_id = f.id
    )
), inserted as (
  insert into public.festival_candidates (
    title,
    source_url,
    source_type,
    festival_name,
    start_date,
    end_date,
    location,
    category,
    score,
    status,
    reviewed_at,
    festival_id,
    draft_json,
    source_assets,
    review_notes
  )
  select
    f.name,
    'legacy://festival/' || f.id,
    'legacy_backfill',
    f.name,
    f.start_date,
    f.end_date,
    f.location,
    f.category,
    100,
    'approved',
    now(),
    f.id,
    jsonb_build_object(
      'candidate', jsonb_build_object(
        'title', f.name,
        'source_type', 'legacy_backfill',
        'source_url', 'legacy://festival/' || f.id,
        'score', 100,
        'source_assets', '[]'::jsonb
      ),
      'festival', jsonb_strip_nulls(jsonb_build_object(
        'name', f.name,
        'normalized_name', f.normalized_name,
        'search_aliases', f.search_aliases,
        'start_date', f.start_date,
        'end_date', f.end_date,
        'location', f.location,
        'address', f.address,
        'region', f.region,
        'category', f.category,
        'description', f.description,
        'price_info', f.price_info,
        'program_info', f.program_info,
        'source_url', f.source_url,
        'official_url', f.official_url,
        'thumbnail_url', f.thumbnail_url,
        'price_type', f.price_type,
        'status', f.status
      )),
      'artists', coalesce((
        select jsonb_agg(
          jsonb_strip_nulls(jsonb_build_object(
            'input_name', a.name,
            'display_name', a.name,
            'normalized_name', a.normalized_name,
            'matched_artist_id', a.id,
            'match_status', 'matched',
            'aliases', coalesce((
              select jsonb_agg(aa.alias_name order by aa.alias_name)
              from public.artist_aliases aa
              where aa.artist_id = a.id
            ), '[]'::jsonb),
            'performance_date', fa.performance_date,
            'performance_time', fa.performance_time,
            'performance_end_time', fa.performance_end_time,
            'stage_name', fa.stage_name,
            'status', fa.status
          ))
          order by fa.performance_date nulls last,
                   fa.performance_time nulls last,
                   a.id
        )
        from public.festival_artists fa
        join public.artists a on a.id = fa.artist_id
        where fa.festival_id = f.id
      ), '[]'::jsonb),
      'tickets', coalesce((
        select jsonb_agg(
          jsonb_strip_nulls(jsonb_build_object(
            'round_type', ft.round_type,
            'round_name', ft.round_name,
            'open_at', ft.open_at,
            'price_info', ft.price_info,
            'ticket_url', ft.ticket_url,
            'ticket_platform', ft.ticket_platform
          ))
          order by ft.open_at nulls last, ft.id
        )
        from public.festival_ticket_rounds ft
        where ft.festival_id = f.id
      ), '[]'::jsonb)
    ),
    '[]'::jsonb,
    'Backfilled approved history for a festival created before the workspace.'
  from target_festivals f
  on conflict (source_url) do nothing
  returning id, festival_id, title, status
)
select *
from inserted
order by festival_id;
