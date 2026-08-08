-- 일반 로그인 사용자의 레거시 관리자 RPC 직접 실행 차단

begin;

revoke all
on function public.import_festival_lineup(bigint, jsonb)
from public, anon, authenticated;

create or replace function public.admin_import_festival_lineup(
  p_festival_id bigint,
  p_artists jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access required.' using errcode = '42501';
  end if;

  return public.import_festival_lineup(p_festival_id, p_artists);
end;
$$;

revoke all
on function public.admin_import_festival_lineup(bigint, jsonb)
from public, anon;

grant execute
on function public.admin_import_festival_lineup(bigint, jsonb)
to authenticated;

commit;
