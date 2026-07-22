begin;

create or replace function public.create_discord_festival_registration_draft(
  p_source_url text,
  p_draft jsonb,
  p_source_assets jsonb,
  p_announcement_round text,
  p_comparison jsonb
)
returns public.festival_candidates
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_work_type text := coalesce(p_comparison->>'work_type', 'needs_review');
  v_existing_festival_id bigint := nullif(p_comparison->>'existing_festival_id', '')::bigint;
  v_created public.festival_candidates;
begin
  if not public.is_festival_bot() then
    raise exception 'Discord Bot 권한이 필요합니다.' using errcode = '42501';
  end if;
  if nullif(pg_catalog.btrim(p_source_url), '') is null then
    raise exception 'Instagram 원본 URL이 필요합니다.' using errcode = '22023';
  end if;
  if exists (
    select 1 from public.festival_candidates
    where source_url = p_source_url
  ) then
    raise exception 'SOURCE_URL_ALREADY_USED' using errcode = '23505';
  end if;
  if v_work_type not in ('new', 'update', 'needs_review') then
    raise exception '올바른 작업 유형이 아닙니다.' using errcode = '22023';
  end if;
  if v_work_type = 'update' and not exists (
    select 1 from public.festivals where id = v_existing_festival_id
  ) then
    raise exception '업데이트할 기존 페스티벌을 찾을 수 없습니다.' using errcode = 'P0002';
  end if;

  p_draft := pg_catalog.jsonb_set(
    p_draft,
    '{workflow}',
    coalesce(p_draft->'workflow', '{}'::jsonb)
      || pg_catalog.jsonb_build_object(
        'step', 'artist_review',
        'confirmed_steps', '[]'::jsonb
      ),
    true
  );

  select * into v_created
  from public.create_discord_festival_candidate(
    p_source_url,
    p_draft,
    p_source_assets,
    v_work_type,
    p_announcement_round,
    p_comparison,
    false
  );

  if v_work_type = 'update' then
    update public.festival_candidates
    set festival_id = v_existing_festival_id
    where id = v_created.id
    returning * into v_created;
  end if;

  return v_created;
end;
$$;

revoke all on function public.create_discord_festival_registration_draft(
  text, jsonb, jsonb, text, jsonb
) from public, anon;

grant execute on function public.create_discord_festival_registration_draft(
  text, jsonb, jsonb, text, jsonb
) to authenticated;

comment on function public.create_discord_festival_registration_draft(
  text, jsonb, jsonb, text, jsonb
) is 'Instagram 신규·기존·판별확인 작업을 하나의 웹 단계형 임시등록으로 만든다. 동일 URL 재추출은 허용하지 않는다.';

commit;
