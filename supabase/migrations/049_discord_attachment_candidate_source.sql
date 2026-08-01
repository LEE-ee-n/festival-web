begin;

create or replace function public.create_discord_festival_candidate(
  p_source_url text,
  p_draft jsonb,
  p_source_assets jsonb,
  p_work_type text,
  p_announcement_round text,
  p_comparison jsonb,
  p_regenerate boolean default false
)
returns public.festival_candidates
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_previous public.festival_candidates;
  v_created public.festival_candidates;
  v_version integer := 1;
  v_source_type text;
  v_default_title text;
begin
  if not public.is_festival_bot() then
    raise exception 'Discord Bot 권한이 필요합니다.' using errcode = '42501';
  end if;

  if p_source_url ~ '^https://(www\.)?instagram\.com/(p|reel)/' then
    v_source_type := 'instagram_discord';
    v_default_title := 'Instagram 축제 후보';
  elsif p_source_url ~ '^https://discord\.com/channels/(@me|[0-9]+)/[0-9]+/[0-9]+$' then
    v_source_type := 'discord_attachment';
    v_default_title := 'Discord 첨부 축제 후보';
  else
    raise exception '올바른 Instagram 게시물 또는 Discord 메시지 URL이 필요합니다.'
      using errcode = '22023';
  end if;

  select * into v_previous
  from public.festival_candidates
  where source_url = p_source_url
  order by version_number desc
  limit 1;
  if found and not p_regenerate then
    raise exception 'DUPLICATE_SOURCE_URL' using errcode = '23505';
  end if;
  if found then
    v_version := v_previous.version_number + 1;
  end if;

  insert into public.festival_candidates (
    title,
    source_url,
    source_type,
    raw_text,
    festival_name,
    start_date,
    end_date,
    location,
    category,
    score,
    status,
    draft_json,
    source_assets,
    work_type,
    announcement_round,
    version_number,
    parent_candidate_id,
    created_by,
    comparison_json
  ) values (
    coalesce(
      nullif(p_draft->'candidate'->>'title', ''),
      p_draft->'festival'->>'name',
      v_default_title
    ),
    p_source_url,
    v_source_type,
    p_draft->'candidate'->>'raw_text',
    p_draft->'festival'->>'name',
    case
      when p_draft->'festival'->>'start_date' ~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}$'
        then (p_draft->'festival'->>'start_date')::date
      else null
    end,
    case
      when p_draft->'festival'->>'end_date' ~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}$'
        then (p_draft->'festival'->>'end_date')::date
      else null
    end,
    nullif(p_draft->'festival'->>'location', ''),
    nullif(p_draft->'festival'->>'category', ''),
    coalesce((p_draft->'candidate'->>'score')::integer, 0),
    'pending',
    p_draft,
    coalesce(p_source_assets, '[]'::jsonb),
    p_work_type,
    coalesce(nullif(p_announcement_round, ''), 'unspecified'),
    v_version,
    case
      when v_previous.id is null then null
      else coalesce(v_previous.parent_candidate_id, v_previous.id)
    end,
    auth.uid(),
    coalesce(p_comparison, '{}'::jsonb)
  )
  returning * into v_created;

  return v_created;
end;
$$;

comment on function public.create_discord_festival_candidate(
  text, jsonb, jsonb, text, text, jsonb, boolean
) is 'Discord Bot의 Instagram 게시물 또는 직접 첨부 이미지 출처를 검증하고 축제 후보를 만든다.';

comment on function public.create_discord_festival_registration_draft(
  text, jsonb, jsonb, text, jsonb
) is 'Discord Bot의 Instagram 게시물 또는 직접 첨부 이미지에서 신규·기존·판별확인 작업을 만든다. 동일 출처 재추출은 허용하지 않는다.';

commit;
