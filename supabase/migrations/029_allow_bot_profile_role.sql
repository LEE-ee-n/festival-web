-- 028을 이미 적용한 운영 DB에서 bot 역할을 허용한다.
begin;
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('user', 'admin', 'bot'));
commit;
