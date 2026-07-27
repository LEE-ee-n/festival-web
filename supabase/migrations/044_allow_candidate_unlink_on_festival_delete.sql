-- Preserve approved registration history while allowing its deleted festival
-- foreign key to be cleared by ON DELETE SET NULL.

begin;

create or replace function public.lock_approved_festival_candidate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old_locked_data jsonb;
  v_new_locked_data jsonb;
begin
  if old.status <> 'approved' then
    return new;
  end if;

  v_old_locked_data :=
    pg_catalog.to_jsonb(old)
    - array['festival_id', 'updated_at'];
  v_new_locked_data :=
    pg_catalog.to_jsonb(new)
    - array['festival_id', 'updated_at'];

  if old.festival_id is not null
     and new.festival_id is null
     and v_new_locked_data = v_old_locked_data then
    return new;
  end if;

  raise exception 'APPROVED_FESTIVAL_CANDIDATE_IS_READ_ONLY'
    using errcode = '55000';
end;
$$;

revoke all on function public.lock_approved_festival_candidate()
from public, anon, authenticated;

comment on function public.lock_approved_festival_candidate() is
'승인 완료 이력은 잠그되 연결된 페스티벌 삭제에 따른 festival_id 해제만 허용한다.';

commit;
