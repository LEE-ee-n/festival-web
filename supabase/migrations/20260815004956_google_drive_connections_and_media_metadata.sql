begin;

create table public.user_external_connections (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  encrypted_refresh_token text not null,
  granted_scopes text[] not null default '{}'::text[],
  connected_at timestamptz not null default now(),
  last_used_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint user_external_connections_provider_check
    check (provider in ('google_drive')),
  constraint user_external_connections_user_provider_unique
    unique (user_id, provider)
);

alter table public.user_external_connections enable row level security;

-- OAuth refresh token은 브라우저 Data API에 절대 노출하지 않는다.
revoke all on public.user_external_connections from public, anon, authenticated;
grant all on public.user_external_connections to service_role;
grant usage, select on sequence public.user_external_connections_id_seq to service_role;

alter table public.user_festival_media
  add column if not exists external_file_name text,
  add column if not exists mime_type text,
  add column if not exists file_size bigint;

alter table public.user_festival_media
  add constraint user_festival_media_file_size_check
    check (file_size is null or file_size >= 0);

create unique index user_festival_media_external_file_unique
on public.user_festival_media (
  user_festival_performance_id,
  provider,
  external_file_id
)
where external_file_id is not null;

create index user_external_connections_user_provider_idx
on public.user_external_connections (user_id, provider);

comment on table public.user_external_connections is
  '서버 전용 외부 서비스 연결 정보. OAuth refresh token은 애플리케이션 키로 암호화한다.';
comment on column public.user_external_connections.encrypted_refresh_token is
  'AES-256-GCM으로 암호화된 refresh token envelope. 평문 저장 금지.';
comment on table public.user_festival_media is
  '미디어 파일 자체가 아닌 Google Drive 등 외부 저장소 파일 메타데이터만 저장한다.';

commit;
