begin;

alter table public.audit_events
add column if not exists audit_summary jsonb;

alter table public.audit_events
drop constraint if exists audit_events_summary_object,
add constraint audit_events_summary_object check (
  audit_summary is null or pg_catalog.jsonb_typeof(audit_summary) = 'object'
);

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
begin
  if pg_catalog.jsonb_typeof(coalesce(p_audit_summary, '{}'::jsonb)) <> 'object' then
    raise exception '감사 요약은 JSON 객체여야 합니다.' using errcode = '22023';
  end if;

  v_result := public.apply_festival_json_update_with_audit(
    p_festival_id, p_basic_changes, p_artists, p_tickets,
    p_source_type, p_source_url, p_source_file_name,
    p_work_type, p_lineup_round, p_announcement_date, p_reason
  );
  v_event_id := (v_result->>'audit_event_id')::bigint;

  update public.audit_events
  set audit_summary = coalesce(p_audit_summary, '{}'::jsonb)
  where id = v_event_id;

  return v_result;
end;
$$;

revoke all on function public.apply_festival_json_update_with_summary(
  bigint, jsonb, jsonb, jsonb, text, text, text, text, text, date, text, jsonb
) from public, anon;
grant execute on function public.apply_festival_json_update_with_summary(
  bigint, jsonb, jsonb, jsonb, text, text, text, text, text, date, text, jsonb
) to authenticated;

comment on column public.audit_events.audit_summary is
'JSON 비교 당시의 유지·추가·변경·삭제·미반영 개수 요약';

commit;
