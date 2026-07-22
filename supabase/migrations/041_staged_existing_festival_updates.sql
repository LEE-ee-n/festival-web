begin;

alter table public.festival_update_drafts
  add column if not exists workflow_json jsonb not null default
    '{"step":"artist_review","confirmed_steps":[]}'::jsonb,
  add column if not exists selection_json jsonb not null default '{}'::jsonb,
  add column if not exists base_festival_updated_at timestamptz,
  add column if not exists base_data_hash text;

create or replace function public.festival_update_data_snapshot(p_festival_id bigint)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'festival', pg_catalog.to_jsonb(f) - 'updated_at',
    'artists', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'id', fa.id,
          'artist_id', fa.artist_id,
          'normalized_name', a.normalized_name,
          'input_name', fa.input_name,
          'performance_date', fa.performance_date,
          'performance_time', fa.performance_time,
          'performance_end_time', fa.performance_end_time,
          'stage_name', fa.stage_name,
          'status', fa.status
        ) order by fa.id
      )
      from public.festival_artists fa
      join public.artists a on a.id = fa.artist_id
      where fa.festival_id = f.id
    ), '[]'::jsonb),
    'tickets', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(t) order by t.id)
      from public.festival_ticket_rounds t
      where t.festival_id = f.id
    ), '[]'::jsonb)
  )
  from public.festivals f
  where f.id = p_festival_id;
$$;

revoke all on function public.festival_update_data_snapshot(bigint)
  from public, anon, authenticated;

update public.festival_update_drafts d
set base_festival_updated_at = f.updated_at,
    base_data_hash = pg_catalog.md5(public.festival_update_data_snapshot(f.id)::text)
from public.festivals f
where f.id = d.festival_id
  and (d.base_festival_updated_at is null or d.base_data_hash is null)
  and d.status = 'pending';

alter table public.festival_update_drafts
  drop constraint if exists festival_update_drafts_workflow_object,
  add constraint festival_update_drafts_workflow_object check (
    pg_catalog.jsonb_typeof(workflow_json) = 'object'
  ),
  drop constraint if exists festival_update_drafts_selection_object,
  add constraint festival_update_drafts_selection_object check (
    pg_catalog.jsonb_typeof(selection_json) = 'object'
  );

create or replace function public.set_festival_update_draft_base_version()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.base_festival_updated_at is null or new.base_data_hash is null then
    select updated_at,
           pg_catalog.md5(public.festival_update_data_snapshot(id)::text)
    into new.base_festival_updated_at, new.base_data_hash
    from public.festivals where id = new.festival_id;
  end if;
  return new;
end;
$$;

drop trigger if exists set_festival_update_draft_base_version
  on public.festival_update_drafts;
create trigger set_festival_update_draft_base_version
before insert on public.festival_update_drafts
for each row execute function public.set_festival_update_draft_base_version();

insert into public.festival_update_drafts (
  festival_id, source_url, source_type, draft_json, comparison_json,
  announcement_round, version_number, created_by, created_at
)
select
  c.festival_id, c.source_url, coalesce(c.source_type, 'instagram_discord'),
  c.draft_json, c.comparison_json, c.announcement_round,
  c.version_number, c.created_by, c.created_at
from public.festival_candidates c
where c.work_type = 'update'
  and c.status = 'pending'
  and c.festival_id is not null
  and c.source_url is not null
  and c.draft_json is not null
on conflict (source_url, version_number) do nothing;

delete from public.festival_candidates c
where c.work_type = 'update'
  and c.status = 'pending'
  and exists (
    select 1 from public.festival_update_drafts d
    where d.source_url = c.source_url
      and d.version_number = c.version_number
  );

create or replace function public.reject_update_festival_candidate()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.work_type = 'update' then
    raise exception '기존 페스티벌 수정은 festival_update_drafts를 사용해야 합니다.'
      using errcode = '22023';
  end if;
  return new;
end;
$$;

drop trigger if exists reject_update_festival_candidate
  on public.festival_candidates;
create trigger reject_update_festival_candidate
before insert or update of work_type on public.festival_candidates
for each row execute function public.reject_update_festival_candidate();

drop policy if exists "Admins can delete festival update drafts"
  on public.festival_update_drafts;
create policy "Admins can delete festival update drafts"
  on public.festival_update_drafts for delete to authenticated
  using (public.is_admin() and status = 'pending');

create or replace function public.finalize_festival_update_draft(
  p_update_draft_id bigint,
  p_basic_changes jsonb default '{}'::jsonb,
  p_artists jsonb default '[]'::jsonb,
  p_tickets jsonb default '[]'::jsonb,
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
  v_draft public.festival_update_drafts%rowtype;
  v_festival public.festivals%rowtype;
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception '관리자 권한이 필요합니다.' using errcode = '42501';
  end if;

  select * into v_draft
  from public.festival_update_drafts
  where id = p_update_draft_id
  for update;
  if not found then
    raise exception '기존 페스티벌 수정 임시저장을 찾을 수 없습니다.' using errcode = 'P0002';
  end if;
  if v_draft.status <> 'pending' then
    raise exception '이미 반영된 수정 작업입니다.' using errcode = '22023';
  end if;
  if v_draft.workflow_json->>'step' <> 'final_confirmation' then
    raise exception '모든 검토 단계를 확정한 뒤 최종 반영해 주세요.' using errcode = '22023';
  end if;

  select * into v_festival
  from public.festivals
  where id = v_draft.festival_id
  for update;
  if not found then
    raise exception '수정할 페스티벌을 찾을 수 없습니다.' using errcode = 'P0002';
  end if;
  perform 1 from public.festival_artists
  where festival_id = v_draft.festival_id for update;
  perform 1 from public.festival_ticket_rounds
  where festival_id = v_draft.festival_id for update;
  if v_draft.base_festival_updated_at is null
     or v_draft.base_data_hash is null
     or v_festival.updated_at is distinct from v_draft.base_festival_updated_at
     or pg_catalog.md5(public.festival_update_data_snapshot(v_draft.festival_id)::text)
        is distinct from v_draft.base_data_hash then
    raise exception '작업 시작 후 페스티벌 데이터가 변경되었습니다. 최신 값으로 다시 비교해 주세요.'
      using errcode = '40001';
  end if;

  v_result := public.apply_festival_json_update_with_summary(
    v_draft.festival_id,
    coalesce(p_basic_changes, '{}'::jsonb),
    coalesce(p_artists, '[]'::jsonb),
    coalesce(p_tickets, '[]'::jsonb),
    v_draft.source_type,
    v_draft.source_url,
    'festival-update-draft-' || v_draft.id::text || '.json',
    p_work_type,
    p_lineup_round,
    p_announcement_date,
    p_reason,
    coalesce(p_audit_summary, '{}'::jsonb)
  );

  update public.festival_update_drafts
  set status = 'applied',
      applied_at = now(),
      draft_json = '{}'::jsonb,
      comparison_json = '{}'::jsonb,
      selection_json = '{}'::jsonb,
      workflow_json = '{"step":"completed","confirmed_steps":["artist_review","artist_confirmation","festival_info","timetable","final_review"]}'::jsonb
  where id = v_draft.id;

  return v_result;
end;
$$;

revoke all on function public.finalize_festival_update_draft(
  bigint, jsonb, jsonb, jsonb, text, text, date, text, jsonb
) from public, anon;
grant execute on function public.finalize_festival_update_draft(
  bigint, jsonb, jsonb, jsonb, text, text, date, text, jsonb
) to authenticated;

comment on function public.finalize_festival_update_draft(
  bigint, jsonb, jsonb, jsonb, text, text, date, text, jsonb
) is '기존 페스티벌 수정 초안을 기준 버전 확인 후 한 트랜잭션과 감사 이벤트로 최종 반영';

commit;
