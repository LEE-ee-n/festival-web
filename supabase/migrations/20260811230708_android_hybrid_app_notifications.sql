-- Android 하이브리드 앱 관심 축제 알림과 Expo Push 발송 기반

begin;

create table public.user_push_devices (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  expo_push_token text not null unique,
  platform text not null,
  app_version text not null,
  is_active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_push_devices_platform_check
    check (platform in ('android', 'ios')),
  constraint user_push_devices_token_check
    check (expo_push_token ~ '^(Exponent|Expo)PushToken\[[^]]+\]$')
);

create index user_push_devices_user_active_idx
on public.user_push_devices (user_id, is_active);

create table public.user_notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  favorite_artist_appearance boolean not null default true,
  followed_festival_update boolean not null default true,
  ticket_day_before boolean not null default true,
  ticket_ten_minutes_before boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notification_events (
  id bigint generated always as identity primary key,
  event_type text not null,
  festival_id bigint references public.festivals(id) on delete cascade,
  artist_id bigint references public.artists(id) on delete cascade,
  scheduled_for timestamptz,
  available_at timestamptz not null default now(),
  status text not null default 'pending',
  dedupe_key text not null unique,
  payload jsonb not null default '{}'::jsonb,
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_events_type_check check (
    event_type in (
      'artist_appearance',
      'festival_update',
      'ticket_day_before',
      'ticket_ten_minutes_before'
    )
  ),
  constraint notification_events_status_check check (
    status in ('pending', 'processing', 'sent', 'failed', 'cancelled')
  ),
  constraint notification_events_attempts_check check (attempts >= 0)
);

create unique index notification_events_pending_festival_update_idx
on public.notification_events (event_type, festival_id)
where event_type = 'festival_update' and status = 'pending';

create index notification_events_due_idx
on public.notification_events (available_at, id)
where status = 'pending';

create index notification_events_ticket_round_idx
on public.notification_events ((payload->>'ticket_round_id'))
where event_type in ('ticket_day_before', 'ticket_ten_minutes_before')
  and status = 'pending';

create table public.notification_deliveries (
  id bigint generated always as identity primary key,
  event_id bigint not null references public.notification_events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id bigint not null references public.user_push_devices(id) on delete cascade,
  dedupe_key text not null unique,
  status text not null default 'pending',
  expo_ticket_id text,
  failure_code text,
  failure_reason text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_deliveries_status_check check (
    status in ('pending', 'sent', 'failed', 'cancelled')
  )
);

create index notification_deliveries_event_idx
on public.notification_deliveries (event_id);

create index notification_deliveries_user_idx
on public.notification_deliveries (user_id, created_at desc);

create index notification_deliveries_expo_ticket_idx
on public.notification_deliveries (expo_ticket_id)
where expo_ticket_id is not null and status = 'sent';

alter table public.user_push_devices enable row level security;
alter table public.user_notification_preferences enable row level security;
alter table public.notification_events enable row level security;
alter table public.notification_deliveries enable row level security;

revoke all on table public.user_push_devices,
  public.user_notification_preferences,
  public.notification_events,
  public.notification_deliveries from anon, authenticated;

grant select, delete on table public.user_push_devices to authenticated;
grant select, insert, update on table public.user_notification_preferences to authenticated;

create policy "Users can read own push devices"
on public.user_push_devices
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can remove own push devices"
on public.user_push_devices
for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read own notification preferences"
on public.user_notification_preferences
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create own notification preferences"
on public.user_notification_preferences
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own notification preferences"
on public.user_notification_preferences
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create trigger set_user_push_devices_updated_at
before update on public.user_push_devices
for each row execute function public.set_updated_at();

create trigger set_user_notification_preferences_updated_at
before update on public.user_notification_preferences
for each row execute function public.set_updated_at();

create trigger set_notification_events_updated_at
before update on public.notification_events
for each row execute function public.set_updated_at();

create trigger set_notification_deliveries_updated_at
before update on public.notification_deliveries
for each row execute function public.set_updated_at();

create trigger enforce_personal_service_access
before insert or update or delete on public.user_notification_preferences
for each row execute function public.enforce_personal_service_access();

create or replace function public.register_push_device(
  p_expo_push_token text,
  p_platform text,
  p_app_version text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_device_id bigint;
begin
  if v_user_id is null then
    raise exception '로그인이 필요합니다.' using errcode = '42501';
  end if;

  if not (select public.has_personal_service_access()) then
    raise exception '베타 이용권이 있어야 알림을 사용할 수 있습니다.'
      using errcode = '42501';
  end if;

  if p_platform not in ('android', 'ios')
    or p_expo_push_token !~ '^(Exponent|Expo)PushToken\[[^]]+\]$'
    or nullif(pg_catalog.btrim(p_app_version), '') is null then
    raise exception '올바르지 않은 앱 기기 정보입니다.' using errcode = '22023';
  end if;

  insert into public.user_push_devices (
    user_id, expo_push_token, platform, app_version,
    is_active, last_seen_at, updated_at
  ) values (
    v_user_id,
    p_expo_push_token,
    p_platform,
    pg_catalog.btrim(p_app_version),
    true,
    now(),
    now()
  )
  on conflict (expo_push_token) do update set
    user_id = excluded.user_id,
    platform = excluded.platform,
    app_version = excluded.app_version,
    is_active = true,
    last_seen_at = now(),
    updated_at = now()
  returning id into v_device_id;

  return v_device_id;
end;
$$;

revoke all on function public.register_push_device(text, text, text)
from public, anon;
grant execute on function public.register_push_device(text, text, text)
to authenticated, service_role;

create or replace function public.deactivate_push_device(
  p_expo_push_token text
)
returns boolean
language sql
security definer
set search_path = ''
as $$
  update public.user_push_devices
  set is_active = false,
      updated_at = now()
  where user_id = (select auth.uid())
    and expo_push_token = p_expo_push_token
  returning true;
$$;

revoke all on function public.deactivate_push_device(text)
from public, anon;
grant execute on function public.deactivate_push_device(text)
to authenticated, service_role;

create or replace function public.enqueue_lineup_notification_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_festival_id bigint := coalesce(new.festival_id, old.festival_id);
begin
  if tg_op = 'INSERT' then
    insert into public.notification_events (
      event_type, festival_id, artist_id, available_at,
      dedupe_key, payload
    ) values (
      'artist_appearance',
      new.festival_id,
      new.artist_id,
      now(),
      'artist_appearance:' || new.id::text,
      jsonb_build_object('festival_artist_id', new.id)
    ) on conflict (dedupe_key) do nothing;
  end if;

  insert into public.notification_events (
    event_type, festival_id, available_at, dedupe_key, payload
  ) values (
    'festival_update',
    v_festival_id,
    now() + interval '10 minutes',
    'festival_update:' || v_festival_id::text || ':' ||
      floor(extract(epoch from now()))::bigint::text,
    jsonb_build_object('change', lower(tg_op))
  )
  on conflict (event_type, festival_id)
    where event_type = 'festival_update' and status = 'pending'
  do update set
    available_at = now() + interval '10 minutes',
    payload = public.notification_events.payload || excluded.payload,
    updated_at = now();

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.enqueue_lineup_notification_event()
from public, anon, authenticated;

create trigger enqueue_lineup_notification_event
after insert or update or delete on public.festival_artists
for each row execute function public.enqueue_lineup_notification_event();

create or replace function public.enqueue_timetable_status_notification_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.timetable_status is not distinct from old.timetable_status then
    return new;
  end if;

  insert into public.notification_events (
    event_type, festival_id, available_at, dedupe_key, payload
  ) values (
    'festival_update',
    new.id,
    now() + interval '10 minutes',
    'festival_update:' || new.id::text || ':' ||
      floor(extract(epoch from now()))::bigint::text,
    jsonb_build_object('change', 'timetable_status')
  )
  on conflict (event_type, festival_id)
    where event_type = 'festival_update' and status = 'pending'
  do update set
    available_at = now() + interval '10 minutes',
    payload = public.notification_events.payload || excluded.payload,
    updated_at = now();

  return new;
end;
$$;

revoke all on function public.enqueue_timetable_status_notification_event()
from public, anon, authenticated;

create trigger enqueue_timetable_status_notification_event
after update of timetable_status on public.festivals
for each row execute function public.enqueue_timetable_status_notification_event();

create or replace function public.reschedule_ticket_notification_events()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ticket_id bigint := coalesce(new.id, old.id);
  v_festival_id bigint := coalesce(new.festival_id, old.festival_id);
  v_open_at timestamptz;
begin
  if tg_op = 'UPDATE'
    and new.open_at is not distinct from old.open_at
    and new.festival_id is not distinct from old.festival_id then
    return new;
  end if;

  update public.notification_events
  set status = 'cancelled',
      updated_at = now()
  where event_type in ('ticket_day_before', 'ticket_ten_minutes_before')
    and status = 'pending'
    and payload->>'ticket_round_id' = v_ticket_id::text;

  if tg_op <> 'DELETE' then
    v_open_at := new.open_at;
  end if;

  if v_open_at is not null and v_open_at - interval '1 day' > now() then
    insert into public.notification_events (
      event_type, festival_id, scheduled_for, available_at,
      dedupe_key, payload
    ) values (
      'ticket_day_before',
      v_festival_id,
      v_open_at,
      v_open_at - interval '1 day',
      'ticket_day_before:' || v_ticket_id::text || ':' || v_open_at::text,
      jsonb_build_object('ticket_round_id', v_ticket_id, 'open_at', v_open_at)
    ) on conflict (dedupe_key) do nothing;
  end if;

  if v_open_at is not null and v_open_at - interval '10 minutes' > now() then
    insert into public.notification_events (
      event_type, festival_id, scheduled_for, available_at,
      dedupe_key, payload
    ) values (
      'ticket_ten_minutes_before',
      v_festival_id,
      v_open_at,
      v_open_at - interval '10 minutes',
      'ticket_ten_minutes_before:' || v_ticket_id::text || ':' || v_open_at::text,
      jsonb_build_object('ticket_round_id', v_ticket_id, 'open_at', v_open_at)
    ) on conflict (dedupe_key) do nothing;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.reschedule_ticket_notification_events()
from public, anon, authenticated;

create trigger reschedule_ticket_notification_events
after insert or update or delete
on public.festival_ticket_rounds
for each row execute function public.reschedule_ticket_notification_events();

insert into public.notification_events (
  event_type, festival_id, scheduled_for, available_at, dedupe_key, payload
)
select
  schedule.event_type,
  ticket.festival_id,
  ticket.open_at,
  schedule.available_at,
  schedule.event_type || ':' || ticket.id::text || ':' || ticket.open_at::text,
  jsonb_build_object('ticket_round_id', ticket.id, 'open_at', ticket.open_at)
from public.festival_ticket_rounds ticket
cross join lateral (
  values
    ('ticket_day_before'::text, ticket.open_at - interval '1 day'),
    ('ticket_ten_minutes_before'::text, ticket.open_at - interval '10 minutes')
) as schedule(event_type, available_at)
where ticket.open_at is not null
  and schedule.available_at > now()
on conflict (dedupe_key) do nothing;

create or replace function public.claim_notification_events(p_limit integer default 50)
returns setof public.notification_events
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_limit < 1 or p_limit > 100 then
    raise exception '처리 개수는 1부터 100까지 가능합니다.' using errcode = '22023';
  end if;

  return query
  with due as (
    select event.id
    from public.notification_events event
    where event.status = 'pending'
      and event.available_at <= now()
    order by event.available_at, event.id
    for update skip locked
    limit p_limit
  )
  update public.notification_events event
  set status = 'processing',
      attempts = event.attempts + 1,
      updated_at = now()
  from due
  where event.id = due.id
  returning event.*;
end;
$$;

revoke all on function public.claim_notification_events(integer)
from public, anon, authenticated;
grant execute on function public.claim_notification_events(integer)
to service_role;

create or replace function public.finish_notification_event(
  p_event_id bigint,
  p_succeeded boolean,
  p_error text default null
)
returns boolean
language sql
security definer
set search_path = ''
as $$
  update public.notification_events
  set status = case when p_succeeded then 'sent' else 'failed' end,
      last_error = case when p_succeeded then null else left(p_error, 1000) end,
      updated_at = now()
  where id = p_event_id
    and status = 'processing'
  returning true;
$$;

revoke all on function public.finish_notification_event(bigint, boolean, text)
from public, anon, authenticated;
grant execute on function public.finish_notification_event(bigint, boolean, text)
to service_role;

comment on table public.user_push_devices is
  '회원별 Expo Push Token과 앱 버전. 영구 실패 토큰은 비활성화한다.';
comment on table public.user_notification_preferences is
  '회원별 모바일 알림 유형 수신 설정.';
comment on table public.notification_events is
  '축제 변경과 티켓 시각을 묶어 처리하는 서버 전용 알림 큐.';
comment on table public.notification_deliveries is
  '기기별 중복 방지 키와 Expo Push 발송 결과.';

commit;
