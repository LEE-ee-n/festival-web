begin;

create or replace function public.replace_pending_discord_source_drafts(
  p_source_url text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_candidate_count integer := 0;
  v_update_count integer := 0;
  v_storage_paths jsonb := '[]'::jsonb;
begin
  if not public.is_festival_bot() then
    raise exception 'Discord Bot 권한이 필요합니다.' using errcode = '42501';
  end if;
  if p_source_url is null
     or (
       p_source_url !~ '^https://(www\.)?instagram\.com/(p|reel)/'
       and p_source_url !~ '^https://discord\.com/channels/(@me|[0-9]+)/[0-9]+/[0-9]+$'
     ) then
    raise exception '올바른 Instagram 게시물 또는 Discord 메시지 URL이 필요합니다.'
      using errcode = '22023';
  end if;

  perform 1
  from public.festival_candidates
  where source_url = p_source_url
  for update;

  perform 1
  from public.festival_update_drafts
  where source_url = p_source_url
  for update;

  if exists (
    select 1
    from public.festival_candidates
    where source_url = p_source_url
      and (status <> 'pending' or created_by is distinct from auth.uid())
  ) or exists (
    select 1
    from public.festival_update_drafts
    where source_url = p_source_url
      and (status <> 'pending' or created_by is distinct from auth.uid())
  ) then
    raise exception 'SOURCE_HAS_PROTECTED_HISTORY' using errcode = '42501';
  end if;

  select coalesce(pg_catalog.jsonb_agg(paths.storage_path), '[]'::jsonb)
  into v_storage_paths
  from (
    select distinct asset->>'storage_path' as storage_path
    from public.festival_candidates candidate
    cross join lateral pg_catalog.jsonb_array_elements(
      case
        when pg_catalog.jsonb_typeof(candidate.source_assets) = 'array'
          then candidate.source_assets
        else '[]'::jsonb
      end
    ) asset
    where candidate.source_url = p_source_url
      and candidate.status = 'pending'
      and candidate.created_by = auth.uid()
      and nullif(pg_catalog.btrim(asset->>'storage_path'), '') is not null
  ) paths;

  delete from public.festival_update_drafts
  where source_url = p_source_url
    and status = 'pending'
    and created_by = auth.uid();
  get diagnostics v_update_count = row_count;

  delete from public.festival_candidates
  where source_url = p_source_url
    and status = 'pending'
    and created_by = auth.uid();
  get diagnostics v_candidate_count = row_count;

  if v_candidate_count + v_update_count = 0 then
    raise exception 'NO_PENDING_SOURCE_DRAFT' using errcode = 'P0002';
  end if;

  return pg_catalog.jsonb_build_object(
    'candidate_count', v_candidate_count,
    'update_count', v_update_count,
    'storage_paths', v_storage_paths
  );
end;
$$;

revoke all on function public.replace_pending_discord_source_drafts(text)
from public, anon;
grant execute on function public.replace_pending_discord_source_drafts(text)
to authenticated;

drop policy if exists "Festival bot can read own update drafts"
on public.festival_update_drafts;
create policy "Festival bot can read own update drafts"
on public.festival_update_drafts
for select
to authenticated
using (
  public.is_festival_bot()
  and created_by = (select auth.uid())
);

drop policy if exists "Festival bot can delete own candidate posters"
on storage.objects;
create policy "Festival bot can delete own candidate posters"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'festival-candidate-posters'
  and public.is_festival_bot()
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

comment on function public.replace_pending_discord_source_drafts(text)
is 'Bot 소유 pending Discord 수집 작업만 잠금 후 삭제하고 임시 포스터 경로를 반환한다.';

commit;
