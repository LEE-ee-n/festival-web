-- Prevent no-op updates from changing updated_at and avoid retry storms when
-- an existing-festival draft is stale.

begin;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (pg_catalog.to_jsonb(new) - 'updated_at')
     is distinct from
     (pg_catalog.to_jsonb(old) - 'updated_at') then
    new.updated_at := pg_catalog.now();
  else
    new.updated_at := old.updated_at;
  end if;

  return new;
end;
$$;

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

  select *
  into v_draft
  from public.festival_update_drafts
  where id = p_update_draft_id
  for update;

  if not found then
    raise exception '기존 페스티벌 수정 임시저장을 찾을 수 없습니다.'
      using errcode = 'P0002';
  end if;

  if v_draft.status <> 'pending' then
    raise exception '이미 반영된 수정 작업입니다.'
      using errcode = '22023';
  end if;

  if v_draft.workflow_json->>'step' <> 'final_confirmation' then
    raise exception '모든 검토 단계를 확정한 뒤 최종 반영해 주세요.'
      using errcode = '22023';
  end if;

  select *
  into v_festival
  from public.festivals
  where id = v_draft.festival_id
  for update;

  if not found then
    raise exception '수정할 페스티벌을 찾을 수 없습니다.'
      using errcode = 'P0002';
  end if;

  perform 1
  from public.festival_artists
  where festival_id = v_draft.festival_id
  for update;

  perform 1
  from public.festival_ticket_rounds
  where festival_id = v_draft.festival_id
  for update;

  if v_draft.base_data_hash is null
     or pg_catalog.md5(
       public.festival_update_data_snapshot(v_draft.festival_id)::text
     ) is distinct from v_draft.base_data_hash then
    raise exception '작업 시작 후 페스티벌 데이터가 변경되었습니다. 최신 값으로 다시 비교해 주세요.'
      using errcode = '22023';
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
      applied_at = pg_catalog.now(),
      draft_json = '{}'::jsonb,
      comparison_json = '{}'::jsonb,
      selection_json = '{}'::jsonb,
      workflow_json = '{
        "step": "completed",
        "confirmed_steps": [
          "artist_review",
          "artist_confirmation",
          "festival_info",
          "timetable",
          "final_review"
        ]
      }'::jsonb
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

comment on function public.set_updated_at() is
  'Updates updated_at only when another column in the row actually changes.';

comment on function public.finalize_festival_update_draft(
  bigint, jsonb, jsonb, jsonb, text, text, date, text, jsonb
) is
  'Finalizes a staged existing-festival update using content-hash conflict detection without retryable business errors.';

commit;
