# Supabase 보안 구조

RLS 정책은 2026-07-17 운영 DB 조회 결과를 기준으로 정리했다.

## 관리자 권한 기준

관리자 권한의 단일 기준은 `public.profiles.role`이다.

- `profiles.id`: `auth.users.id`와 동일한 UUID
- `profiles.role = 'admin'`: 관리자
- 그 외의 값: 일반 사용자
- 애플리케이션은 `public.is_admin()` RPC만 호출한다.

`admin_users` 테이블은 사용하지 않는다.

## 관리자 판별 함수

`public.is_admin()`은 현재 로그인 사용자의 `auth.uid()`와
`public.profiles.id`가 일치하고 `role = 'admin'`인지 확인한다.

함수는 `SECURITY DEFINER`로 실행되며 `search_path`를 비워 객체를
항상 정규화된 이름으로 참조한다. 실행 권한은 `authenticated`와
`service_role`에만 부여한다.

## 애플리케이션 보호

- `/admin/login`을 제외한 `/admin` 하위 경로는 공통 관리자 레이아웃이 보호한다.
- 사용자 검증은 `supabase.auth.getUser()`를 사용한다.
- 관리자 판별은 `public.is_admin()`을 사용한다.
- 화면 가드는 편의 기능이며 실제 데이터 보호의 최종 책임은 RLS에 있다.

## RLS 쓰기 정책

다음 테이블의 INSERT, UPDATE, DELETE는 인증된 관리자만 허용한다.

- `festivals`
- `artists`
- `artist_aliases`
- `festival_artists`
- `festival_ticket_rounds`

`festival-thumbnails` Storage 버킷의 업로드, 수정, 삭제도 관리자만 허용한다.
이 버킷은 JPG, PNG, WebP만 허용하며 파일당 최대 크기는 5MB다.

공개 조회는 승인된 축제 데이터로 제한한다.

- 축제: `verification_status = 'approved'`이고 취소되지 않은 행만 공개
- 아티스트와 아티스트 별칭: 공개 조회
- 축제 출연진: 공개 축제에 속하고 상태가 `scheduled` 또는 `confirmed`인 행만 공개
- 티켓 회차: 공개 축제에 속한 행만 공개
- 관리자는 승인 전·취소 데이터를 포함해 축제, 출연진, 티켓 회차 전체 조회

JSON·XLSX 등록 함수는 `SECURITY INVOKER`로 실행하며 함수 내부에서도
`public.is_admin()`을 확인한다. 로그인만 한 일반 사용자는 실행할 수 없다.

정책 정의는
[`supabase/migrations/005_profiles_admin_authorization.sql`](supabase/migrations/005_profiles_admin_authorization.sql)에 있다.

## 관리자 지정

관리자 UUID를 확인한 뒤 Supabase SQL Editor에서 다음과 같이 지정한다.
`profiles` 행이 아직 없어도 생성되도록 UPSERT를 사용한다.

```sql
insert into public.profiles (id, role)
values ('<auth.users의 사용자 UUID>', 'admin')
on conflict (id)
do update set role = excluded.role;
```

일반 사용자로 되돌릴 때는 `role = 'user'`로 변경한다.

## 확인 쿼리

```sql
select id, role
from public.profiles
order by role, id;
```

```sql
select pg_get_functiondef('public.is_admin()'::regprocedure);
```

```sql
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;
```

SQL Editor는 일반적으로 `postgres` 권한으로 실행되기 때문에
브라우저 로그인 사용자의 `auth.uid()` 테스트를 대신하지 못한다.
최종 확인은 관리자와 일반 사용자 계정으로 각각 로그인해서 진행한다.

## 주의사항

- `service_role` 키는 브라우저나 `NEXT_PUBLIC_*` 환경변수에 넣지 않는다.
- 사용자가 자신의 `profiles.role`을 수정할 수 있는 정책을 만들지 않는다.
- 공개 SELECT 정책과 관리자 쓰기 정책을 분리한다.
- 005 마이그레이션은 대상 테이블의 기존 INSERT, UPDATE, DELETE, ALL 정책을 제거하고 관리자 정책으로 교체한다.
- 운영 DB 변경 전 마이그레이션 SQL을 검토하고 백업한다.
