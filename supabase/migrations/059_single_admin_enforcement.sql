-- Festibom 운영 관리자는 최대 1명만 허용한다.

begin;

do $$
begin
  if (
    select pg_catalog.count(*)
    from public.profiles
    where role = 'admin'
  ) > 1 then
    raise exception '둘 이상의 관리자 프로필이 있어 단일 관리자 제약을 적용할 수 없습니다.';
  end if;
end;
$$;

create unique index if not exists profiles_single_admin_unique
on public.profiles (role)
where role = 'admin';

revoke insert, update, delete, truncate, references, trigger
on table public.profiles
from anon, authenticated;

comment on index public.profiles_single_admin_unique is
  'Festibom 운영 관리자 role은 최대 한 프로필에만 허용';

commit;
