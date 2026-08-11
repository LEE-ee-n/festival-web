# Supabase 보안 구조

RLS 정책은 2026-07-17 운영 DB 조회 결과를 기준으로 정리했다.

## 관리자 권한 기준

관리자 권한의 단일 기준은 `public.profiles.role`이다.

- `profiles.id`: `auth.users.id`와 동일한 UUID
- `profiles.role = 'admin'`: 관리자
- 그 외의 값: 일반 사용자
- 애플리케이션은 `public.is_admin()` RPC만 호출한다.
- `profiles_single_admin_unique` 부분 고유 인덱스로 `admin` 역할은 최대 1명만 허용한다.

`admin_users` 테이블은 사용하지 않는다.

## 관리자 판별 함수

`public.is_admin()`은 현재 로그인 사용자의 `auth.uid()`와
`public.profiles.id`가 일치하고 `role = 'admin'`인지 확인한다.

함수는 `SECURITY DEFINER`로 실행되며 `search_path`를 비워 객체를
항상 정규화된 이름으로 참조한다. 실행 권한은 `authenticated`와
`service_role`에만 부여한다.

## 애플리케이션 보호

- `/admin/login`을 제외한 `/admin` 하위 경로는 공통 관리자 레이아웃이 보호한다.
- 일반 회원이 `/admin` 하위 경로에 접근하면 홈으로 이동하며 관리자 화면은 렌더링하지 않는다.
- 로그인된 일반 회원이 `/admin/login`을 직접 열어도 홈으로 이동한다.
- localhost 일반 Google 회원으로 `/admin`과 `/admin/login`의 홈 이동을 실제 확인했다.
- 사용자 검증은 `supabase.auth.getUser()`를 사용한다.
- 관리자 판별은 `public.is_admin()`을 사용한다.
- 화면 가드는 편의 기능이며 실제 데이터 보호의 최종 책임은 RLS에 있다.

## 공개 사용자 Google 로그인

- 공개 사용자는 `/login`에서 Google OAuth로만 로그인한다.
- Google Client Secret은 Supabase Provider 설정에만 저장하고 브라우저 코드나 저장소에 넣지 않는다.
- OAuth 반환 경로는 운영 홈페이지와 localhost 개발 주소만 허용한다.
- 공개 회원은 `profiles.role`을 생성·수정할 권한이 없으며 관리자 여부는 기존 `public.is_admin()`으로만 판정한다.
- 관리자 역할은 운영 DB에서 최대 1명만 존재할 수 있다.
- 관심 아티스트와 개인 일정은 본인의 `auth.uid()`와 일치하는 행만 조회·추가·삭제할 수 있다.
- 개인 일정에는 공개된 예정·진행 중 축제의 시간 확정 공연만 추가할 수 있다.
- Google provider token은 저장하거나 Google API 호출에 사용하지 않는다.
- 레거시 `import_festival_lineup` RPC의 일반 인증 사용자 실행 권한을 제거하고, `public.is_admin()`을 확인하는 `admin_import_festival_lineup`만 관리자 화면에서 호출한다.

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

## 2026-07-30 보안 준비도 평가

현재 보안 준비도는 약 55~60%로 평가한다.

- 익명 사용자나 일반 로그인 사용자가 운영 데이터를 직접 변경하는 공격에는 비교적 강한 구조다.
- 관리자 계정 탈취, 프레임워크 취약점, 공격 탐지와 사고 복구까지 포함하면 공개 운영 전에 보강이 필요하다.
- 이 평가는 코드와 migration 기준이며 실제 운영 DB 정책·Supabase 설정·Vercel 설정을 직접 확인한 결과는 아니다.

### 현재 강점

- 브라우저에서는 Supabase 익명 키만 사용하며 `service_role` 키를 사용하지 않는다.
- 화면 가드와 별개로 RLS와 DB 함수가 쓰기 권한을 다시 확인한다.
- 관리자와 Discord Bot 역할을 분리하고 Bot의 테이블·Storage 접근 범위를 제한한다.
- `SECURITY DEFINER` 함수는 빈 `search_path`와 정규화된 객체 이름을 사용한다.
- 이미지의 확장자, MIME, 최대 5MB 용량과 파일 시그니처를 검사한다.
- React 기본 이스케이프를 사용하고 JSON-LD 직렬화 시 `<`를 이스케이프한다.

### 우선 보강 항목

1. Next.js 보안 버전 업데이트
   - `16.2.10`에서 `16.3.0`으로 업데이트했고 PostCSS 8.5.26, Sharp 0.35.3, Nanoid 3.3.18을 함께 적용했다.
   - 운영·개발 의존성 `npm audit` 0건, 테스트 276개, 타입 검사와 ESLint 오류 0개를 확인했다.
   - 사용자 환경에서 프로덕션 빌드의 컴파일, TypeScript, 페이지 데이터 수집과 정적 페이지 29개 생성을 모두 확인했다.
2. 관리자 MFA 강제
   - 2026-08-11 단일 관리자 계정에 TOTP MFA를 등록했다.
   - 공통 `is_admin()`이 관리자 role과 JWT `aal2`를 함께 요구하도록 운영 DB에 적용했다.
   - 관리자 `aal1`·일반 회원 `aal2` 거부와 관리자 `aal2` 허용을 DB 역할 시험으로 확인했다.
3. 운영 DB 권한 재검증
   - 2026-08-11 운영 Security Advisor와 public 테이블·함수 권한을 확인하고 위험 RPC 권한을 보강했다.
   - 일반 회원 관리자 RPC 거부, 관리자·Bot 전용 RPC 허용, 두 일반 회원 간 개인 데이터 교차 조회 거부를 확인했다.
   - Advisor 경고는 56건에서 41건, 익명 실행 가능 `SECURITY DEFINER` 경고는 8건에서 0건으로 줄었다.
4. HTTP 보안 헤더
   - CSP, `frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`를 검토해 적용한다.
   - 외부 Pretendard 폰트, Supabase Storage 이미지와 JSON-LD가 CSP에서 정상 동작하는지 확인한다.
5. 인증 공격 방어
   - Supabase Auth rate limit 설정을 확인한다.
   - 관리자 로그인에 CAPTCHA 또는 Cloudflare Turnstile 적용을 검토한다.
   - 비밀번호 최소 길이·문자 조합·유출 비밀번호 차단과 세션 최대 수명 설정을 확인한다.
6. 탐지와 복구
   - 관리자 로그인 실패 급증, 관리자·Bot 로그인, RPC 오류와 RLS 거부를 감시한다.
   - Vercel Firewall 알림과 Supabase 로그 확인 절차를 마련한다.
   - 관리자·Bot 비밀번호 및 세션 폐기, 키 교체와 사고 대응 순서를 문서화한다.
   - Supabase 백업 복원 시험을 수행한다.

### 운영 전 보안 확인표

- [x] Next.js 보안 수정 버전 적용, 의존성 감사 0건과 프로덕션 빌드 확인
- [ ] 웹과 Discord Bot 의존성 보안 감사 통과
- [x] 관리자 MFA 등록과 `aal2` 권한 강제
- [ ] 관리자 로그인 rate limit·CAPTCHA·비밀번호 정책 확인
- [x] Supabase Security Advisor 경고 검토와 고위험 RPC 권한 보강
- [ ] 익명 사용자의 모든 관리 테이블 쓰기 거부 확인
- [x] 일반 로그인 사용자의 관리자 Excel 수정 RPC 실행 거부 확인
- [ ] Bot의 관리자 테이블 및 다른 사용자의 후보·파일 접근 거부 확인
- [ ] 관리자 계정의 정상 등록·수정·삭제 확인
- [ ] Storage 파일 형식·크기·경로 제한 확인
- [ ] HTTP 보안 헤더와 CSP 적용 후 공개 화면 회귀 확인
- [ ] Vercel WAF·로그·알림 확인
- [ ] Supabase 백업 복구 시험
- [ ] 사고 시 세션 폐기·비밀번호 및 키 교체 절차 확인

### 이번 평가에서 확인하지 못한 사항

- 운영 Security Advisor와 핵심 RPC·RLS는 확인했지만 관리자 MFA·`aal2`, Auth 세션 정책과 개인 데이터 전체 쓰기 격리 시험은 남아 있다.
- Vercel Firewall과 보안 알림의 실제 설정은 확인하지 않았다.
- 실제 침투 테스트, 부하 공격과 계정 탈취 시나리오는 실행하지 않았다.

### 참고 자료

- [Next.js 2026년 7월 보안 릴리스](https://nextjs.org/blog)
- [Next.js 보안 헤더 설정](https://nextjs.org/docs/app/api-reference/config/next-config-js/headers)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Security Advisor](https://supabase.com/docs/guides/database/database-advisors)
- [Supabase MFA](https://supabase.com/docs/guides/auth/auth-mfa)
- [Supabase CAPTCHA](https://supabase.com/docs/guides/auth/auth-captcha)
- [Supabase Auth rate limits](https://supabase.com/docs/guides/auth/rate-limits)
- [Vercel Firewall](https://vercel.com/docs/vercel-firewall)
