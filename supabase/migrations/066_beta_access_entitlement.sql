-- 베타 이용권과 가입자 관리. 개인 데이터 조회는 유지하고 변경만 중앙 차단한다.

begin;

create table if not exists public.service_access_settings (
  id boolean primary key default true check (id),
  beta_limit integer not null default 20 check (beta_limit > 0),
  updated_at timestamptz not null default now()
);

insert into public.service_access_settings (id, beta_limit)
values (true, 20)
on conflict (id) do nothing;

create table if not exists public.service_access_entitlements (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  entitlement_key text not null default 'personal_features',
  source text not null,
  status text not null default 'active',
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_access_entitlements_key_check
    check (entitlement_key = 'personal_features'),
  constraint service_access_entitlements_source_check
    check (source in ('beta_manual', 'payment', 'promotion')),
  constraint service_access_entitlements_status_check
    check (status in ('active', 'revoked')),
  constraint service_access_entitlements_period_check
    check (ends_at is null or ends_at > starts_at)
);

create unique index if not exists service_access_beta_user_unique
on public.service_access_entitlements (user_id, entitlement_key)
where source = 'beta_manual';

create index if not exists service_access_active_user_idx
on public.service_access_entitlements (user_id, entitlement_key, status, ends_at);

alter table public.service_access_settings enable row level security;
alter table public.service_access_entitlements enable row level security;

revoke all on public.service_access_settings,
  public.service_access_entitlements from anon, authenticated;

create or replace function public.has_personal_service_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.service_access_entitlements entitlement
    where entitlement.user_id = (select auth.uid())
      and entitlement.entitlement_key = 'personal_features'
      and entitlement.status = 'active'
      and entitlement.starts_at <= now()
      and (entitlement.ends_at is null or entitlement.ends_at > now())
  );
$$;

revoke all on function public.has_personal_service_access() from public, anon;
grant execute on function public.has_personal_service_access() to authenticated;
grant execute on function public.has_personal_service_access() to service_role;

-- 관리자 계정은 기존 개인 기능을 잃지 않도록 베타 이용권을 최초 1회 부여한다.
insert into public.service_access_entitlements (
  user_id, entitlement_key, source, status, granted_by
)
select profile.id, 'personal_features', 'beta_manual', 'active', profile.id
from public.profiles profile
where profile.role = 'admin'
  and not exists (
    select 1
    from public.service_access_entitlements entitlement
    where entitlement.user_id = profile.id
      and entitlement.entitlement_key = 'personal_features'
      and entitlement.source = 'beta_manual'
  );

create or replace function public.enforce_personal_service_access()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- FK cascade, service role과 운영 관리 작업은 사용자 이용권 판정 대상이 아니다.
  if (select auth.uid()) is null or (select public.is_admin()) then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if not (select public.has_personal_service_access()) then
    raise exception '베타 이용권이 있어야 개인 기능을 사용할 수 있습니다.'
      using errcode = '42501';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_personal_service_access() from public, anon, authenticated;
grant execute on function public.enforce_personal_service_access() to service_role;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'user_favorite_festivals',
    'user_favorite_artists',
    'user_schedule_items',
    'user_festival_diaries',
    'user_festival_performances',
    'user_festival_songs',
    'user_festival_media'
  ]
  loop
    execute format(
      'drop trigger if exists enforce_personal_service_access on public.%I',
      table_name
    );
    execute format(
      'create trigger enforce_personal_service_access before insert or update or delete on public.%I for each row execute function public.enforce_personal_service_access()',
      table_name
    );
  end loop;
end;
$$;

create or replace function public.admin_list_service_users()
returns table (
  signup_number bigint,
  user_id uuid,
  email text,
  display_name text,
  is_admin boolean,
  joined_at timestamptz,
  beta_access_number bigint,
  has_beta_access boolean,
  access_status text,
  granted_at timestamptz,
  revoked_at timestamptz,
  beta_limit integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (select public.is_admin()) then
    raise exception '관리자 권한이 필요합니다.' using errcode = '42501';
  end if;

  return query
  select
    row_number() over (order by auth_user.created_at, auth_user.id)::bigint,
    auth_user.id,
    auth_user.email::text,
    coalesce(
      nullif(pg_catalog.btrim(profile.display_name), ''),
      nullif(pg_catalog.btrim(auth_user.raw_user_meta_data->>'full_name'), ''),
      nullif(pg_catalog.btrim(auth_user.raw_user_meta_data->>'name'), ''),
      split_part(auth_user.email, '@', 1),
      '사용자'
    )::text,
    coalesce(profile.role = 'admin', false),
    auth_user.created_at,
    beta.id,
    coalesce(
      beta.status = 'active'
        and beta.starts_at <= now()
        and (beta.ends_at is null or beta.ends_at > now()),
      false
    ),
    beta.status,
    beta.granted_at,
    beta.revoked_at,
    settings.beta_limit
  from auth.users auth_user
  left join public.profiles profile on profile.id = auth_user.id
  left join public.service_access_entitlements beta
    on beta.user_id = auth_user.id
    and beta.entitlement_key = 'personal_features'
    and beta.source = 'beta_manual'
  cross join public.service_access_settings settings
  where settings.id = true
  order by auth_user.created_at, auth_user.id;
end;
$$;

revoke all on function public.admin_list_service_users() from public, anon;
grant execute on function public.admin_list_service_users() to authenticated;

create or replace function public.admin_set_beta_access(
  p_user_id uuid,
  p_enabled boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit integer;
  v_active_count integer;
begin
  if not (select public.is_admin()) then
    raise exception '관리자 권한이 필요합니다.' using errcode = '42501';
  end if;

  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception '가입 회원을 찾을 수 없습니다.';
  end if;

  if not p_enabled and exists (
    select 1 from public.profiles
    where id = p_user_id and role = 'admin'
  ) then
    raise exception '운영 관리자 계정의 베타 이용권은 회수할 수 없습니다.';
  end if;

  select beta_limit into v_limit
  from public.service_access_settings
  where id = true
  for update;

  if p_enabled then
    if not exists (
      select 1
      from public.service_access_entitlements entitlement
      where entitlement.user_id = p_user_id
        and entitlement.entitlement_key = 'personal_features'
        and entitlement.source = 'beta_manual'
        and entitlement.status = 'active'
        and entitlement.starts_at <= now()
        and (entitlement.ends_at is null or entitlement.ends_at > now())
    ) then
      select count(*)::integer into v_active_count
      from public.service_access_entitlements entitlement
      where entitlement.entitlement_key = 'personal_features'
        and entitlement.source = 'beta_manual'
        and entitlement.status = 'active'
        and entitlement.starts_at <= now()
        and (entitlement.ends_at is null or entitlement.ends_at > now());

      if v_active_count >= v_limit then
        raise exception '베타 이용 인원은 최대 %명입니다.', v_limit;
      end if;
    end if;

    insert into public.service_access_entitlements (
      user_id, entitlement_key, source, status,
      starts_at, ends_at, granted_at, revoked_at, granted_by, updated_at
    ) values (
      p_user_id, 'personal_features', 'beta_manual', 'active',
      now(), null, now(), null, (select auth.uid()), now()
    )
    on conflict (user_id, entitlement_key) where source = 'beta_manual'
    do update set
      status = 'active',
      starts_at = now(),
      ends_at = null,
      granted_at = now(),
      revoked_at = null,
      granted_by = (select auth.uid()),
      updated_at = now();
  else
    update public.service_access_entitlements
    set status = 'revoked',
        revoked_at = now(),
        updated_at = now()
    where user_id = p_user_id
      and entitlement_key = 'personal_features'
      and source = 'beta_manual';
  end if;

  return p_enabled;
end;
$$;

revoke all on function public.admin_set_beta_access(uuid, boolean) from public, anon;
grant execute on function public.admin_set_beta_access(uuid, boolean) to authenticated;

comment on table public.service_access_entitlements is
  '개인 기능을 실행할 수 있는 서비스 이용권. 조회 권한과 분리한다.';
comment on function public.has_personal_service_access() is
  '현재 로그인 회원이 활성 개인 기능 이용권을 보유했는지 판정한다.';

commit;
