begin;

alter table public.festivals
add column if not exists instagram_url text;

alter table public.festivals
drop constraint if exists festivals_instagram_url_format,
add constraint festivals_instagram_url_format check (
  instagram_url is null
  or instagram_url ~ '^https://www\.instagram\.com/[A-Za-z0-9._]+/$'
);

comment on column public.festivals.instagram_url is
  '관리자가 최종 확인한 축제 공식 Instagram 계정 URL';

create or replace function public.create_festival_with_audit(p_festival jsonb)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_name text;
  v_festival public.festivals%rowtype;
  v_event_id bigint;
begin
  if not public.is_admin() then
    raise exception '관리자 권한이 필요합니다.' using errcode = '42501';
  end if;

  select coalesce(nullif(pg_catalog.btrim(display_name), ''), '관리자')
  into v_actor_name from public.profiles where id = v_actor_id;
  if v_actor_name is null then
    raise exception '관리자 프로필의 표시 이름을 확인해 주세요.' using errcode = '22023';
  end if;

  insert into public.festivals (
    name, normalized_name, search_aliases, start_date, end_date,
    location, address, region, category, description, thumbnail_url,
    official_url, instagram_url, price_type, price_info, program_info, status,
    verification_status
  ) values (
    nullif(pg_catalog.btrim(p_festival->>'name'), ''),
    nullif(pg_catalog.btrim(p_festival->>'normalized_name'), ''),
    nullif(pg_catalog.btrim(p_festival->>'search_aliases'), ''),
    nullif(p_festival->>'start_date', '')::date,
    nullif(p_festival->>'end_date', '')::date,
    nullif(pg_catalog.btrim(p_festival->>'location'), ''),
    nullif(pg_catalog.btrim(p_festival->>'address'), ''),
    nullif(pg_catalog.btrim(p_festival->>'region'), ''),
    nullif(pg_catalog.btrim(p_festival->>'category'), ''),
    nullif(pg_catalog.btrim(p_festival->>'description'), ''),
    nullif(pg_catalog.btrim(p_festival->>'thumbnail_url'), ''),
    nullif(pg_catalog.btrim(p_festival->>'official_url'), ''),
    nullif(pg_catalog.btrim(p_festival->>'instagram_url'), ''),
    nullif(pg_catalog.btrim(p_festival->>'price_type'), ''),
    nullif(pg_catalog.btrim(p_festival->>'price_info'), ''),
    nullif(pg_catalog.btrim(p_festival->>'program_info'), ''),
    coalesce(nullif(pg_catalog.btrim(p_festival->>'status'), ''), 'scheduled'),
    coalesce(nullif(pg_catalog.btrim(p_festival->>'verification_status'), ''), 'pending')
  ) returning * into v_festival;

  insert into public.audit_events (
    actor_id, actor_name, action_type, festival_id, festival_name
  ) values (
    v_actor_id, v_actor_name, 'festival.created', v_festival.id, v_festival.name
  ) returning id into v_event_id;

  insert into public.audit_changes (
    event_id, entity_type, entity_id, entity_label, operation, before_data, after_data
  ) values (
    v_event_id, 'festival', v_festival.id::text, v_festival.name,
    'insert', null, pg_catalog.to_jsonb(v_festival)
  );

  return v_festival.id;
end;
$$;

create or replace function public.update_festival_basic_info_with_audit(
  p_festival_id bigint,
  p_festival jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_name text;
  v_before public.festivals%rowtype;
  v_after public.festivals%rowtype;
  v_event_id bigint;
begin
  if not public.is_admin() then
    raise exception '관리자 권한이 필요합니다.' using errcode = '42501';
  end if;

  select coalesce(nullif(pg_catalog.btrim(display_name), ''), '관리자')
  into v_actor_name from public.profiles where id = v_actor_id;
  if v_actor_name is null then
    raise exception '관리자 프로필의 표시 이름을 확인해 주세요.' using errcode = '22023';
  end if;

  select * into v_before from public.festivals
  where id = p_festival_id for update;
  if not found then
    raise exception '수정할 축제를 찾을 수 없습니다.' using errcode = 'P0002';
  end if;

  update public.festivals set
    name = nullif(pg_catalog.btrim(p_festival->>'name'), ''),
    normalized_name = nullif(pg_catalog.btrim(p_festival->>'normalized_name'), ''),
    search_aliases = nullif(pg_catalog.btrim(p_festival->>'search_aliases'), ''),
    start_date = nullif(p_festival->>'start_date', '')::date,
    end_date = nullif(p_festival->>'end_date', '')::date,
    location = nullif(pg_catalog.btrim(p_festival->>'location'), ''),
    address = nullif(pg_catalog.btrim(p_festival->>'address'), ''),
    region = nullif(pg_catalog.btrim(p_festival->>'region'), ''),
    category = nullif(pg_catalog.btrim(p_festival->>'category'), ''),
    description = nullif(pg_catalog.btrim(p_festival->>'description'), ''),
    thumbnail_url = nullif(pg_catalog.btrim(p_festival->>'thumbnail_url'), ''),
    official_url = nullif(pg_catalog.btrim(p_festival->>'official_url'), ''),
    instagram_url = nullif(pg_catalog.btrim(p_festival->>'instagram_url'), ''),
    price_type = nullif(pg_catalog.btrim(p_festival->>'price_type'), ''),
    price_info = nullif(pg_catalog.btrim(p_festival->>'price_info'), ''),
    program_info = nullif(pg_catalog.btrim(p_festival->>'program_info'), ''),
    status = nullif(pg_catalog.btrim(p_festival->>'status'), ''),
    verification_status = coalesce(
      nullif(pg_catalog.btrim(p_festival->>'verification_status'), ''), 'pending'
    )
  where id = p_festival_id
  returning * into v_after;

  if (pg_catalog.to_jsonb(v_before) - 'updated_at')
     = (pg_catalog.to_jsonb(v_after) - 'updated_at') then
    return v_after.id;
  end if;

  insert into public.audit_events (
    actor_id, actor_name, action_type, festival_id, festival_name
  ) values (
    v_actor_id, v_actor_name, 'festival.updated', v_after.id, v_after.name
  ) returning id into v_event_id;

  insert into public.audit_changes (
    event_id, entity_type, entity_id, entity_label, operation, before_data, after_data
  ) values (
    v_event_id, 'festival', v_after.id::text, v_after.name,
    'update', pg_catalog.to_jsonb(v_before), pg_catalog.to_jsonb(v_after)
  );

  return v_after.id;
end;
$$;

alter function public.approve_new_festival_candidate(bigint, jsonb, text)
rename to approve_new_festival_candidate_base_047;

revoke all on function public.approve_new_festival_candidate_base_047(bigint, jsonb, text)
from public, anon, authenticated;

create function public.approve_new_festival_candidate(
  p_candidate_id bigint,
  p_draft jsonb,
  p_review_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
  v_festival_id bigint;
  v_event_id bigint;
  v_instagram_url text;
  v_festival public.festivals%rowtype;
begin
  v_result := public.approve_new_festival_candidate_base_047(
    p_candidate_id, p_draft, p_review_notes
  );
  v_festival_id := (v_result->>'festival_id')::bigint;
  v_event_id := (v_result->>'audit_event_id')::bigint;
  v_instagram_url := nullif(pg_catalog.btrim(p_draft->'festival'->>'instagram_url'), '');

  if v_instagram_url is not null then
    update public.festivals set instagram_url = v_instagram_url
    where id = v_festival_id returning * into v_festival;

    update public.audit_changes
    set after_data = pg_catalog.to_jsonb(v_festival)
    where event_id = v_event_id
      and entity_type = 'festival'
      and entity_id = v_festival_id::text
      and operation = 'insert';
  end if;

  return v_result;
end;
$$;

create or replace function public.apply_festival_json_update_with_summary(
  p_festival_id bigint,
  p_basic_changes jsonb default '{}'::jsonb,
  p_artists jsonb default '[]'::jsonb,
  p_tickets jsonb default '[]'::jsonb,
  p_source_type text default null,
  p_source_url text default null,
  p_source_file_name text default null,
  p_work_type text default null,
  p_lineup_round text default null,
  p_announcement_date date default null,
  p_reason text default null,
  p_audit_summary jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
  v_event_id bigint;
  v_before public.festivals%rowtype;
  v_after public.festivals%rowtype;
  v_instagram_url text;
  v_existing_change_id bigint;
begin
  if pg_catalog.jsonb_typeof(coalesce(p_audit_summary, '{}'::jsonb)) <> 'object' then
    raise exception '감사 요약은 JSON 객체여야 합니다.' using errcode = '22023';
  end if;

  select * into v_before from public.festivals where id = p_festival_id;

  v_result := public.apply_festival_json_update_with_audit(
    p_festival_id, p_basic_changes, p_artists, p_tickets,
    p_source_type, p_source_url, p_source_file_name,
    p_work_type, p_lineup_round, p_announcement_date, p_reason
  );
  v_event_id := (v_result->>'audit_event_id')::bigint;

  if coalesce(p_basic_changes, '{}'::jsonb) ? 'instagram_url' then
    v_instagram_url := nullif(pg_catalog.btrim(p_basic_changes->>'instagram_url'), '');
    update public.festivals set instagram_url = v_instagram_url
    where id = p_festival_id returning * into v_after;

    if v_before.instagram_url is distinct from v_after.instagram_url then
      select id into v_existing_change_id
      from public.audit_changes
      where event_id = v_event_id
        and entity_type = 'festival'
        and entity_id = p_festival_id::text
        and operation = 'update'
      order by id limit 1;

      if v_existing_change_id is null then
        insert into public.audit_changes (
          event_id, entity_type, entity_id, entity_label,
          operation, before_data, after_data
        ) values (
          v_event_id, 'festival', p_festival_id::text, v_after.name,
          'update', pg_catalog.to_jsonb(v_before), pg_catalog.to_jsonb(v_after)
        );
        v_result := pg_catalog.jsonb_set(
          v_result,
          '{change_count}',
          pg_catalog.to_jsonb(coalesce((v_result->>'change_count')::integer, 0) + 1)
        );
      else
        update public.audit_changes
        set after_data = pg_catalog.to_jsonb(v_after),
            entity_label = v_after.name
        where id = v_existing_change_id;
      end if;
    end if;
  end if;

  update public.audit_events
  set audit_summary = coalesce(p_audit_summary, '{}'::jsonb)
  where id = v_event_id;

  return v_result;
end;
$$;

update public.festival_update_drafts d
set base_festival_updated_at = f.updated_at,
    base_data_hash = pg_catalog.md5(public.festival_update_data_snapshot(f.id)::text)
from public.festivals f
where f.id = d.festival_id and d.status = 'pending';

revoke all on function public.create_festival_with_audit(jsonb) from public, anon;
revoke all on function public.update_festival_basic_info_with_audit(bigint, jsonb) from public, anon;
revoke all on function public.approve_new_festival_candidate(bigint, jsonb, text) from public, anon;
revoke all on function public.apply_festival_json_update_with_summary(
  bigint, jsonb, jsonb, jsonb, text, text, text, text, text, date, text, jsonb
) from public, anon;

grant execute on function public.create_festival_with_audit(jsonb) to authenticated;
grant execute on function public.update_festival_basic_info_with_audit(bigint, jsonb) to authenticated;
grant execute on function public.approve_new_festival_candidate(bigint, jsonb, text) to authenticated;
grant execute on function public.apply_festival_json_update_with_summary(
  bigint, jsonb, jsonb, jsonb, text, text, text, text, text, date, text, jsonb
) to authenticated;

commit;
