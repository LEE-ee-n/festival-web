# [완료] Supabase Security Advisor·RPC 권한 보강

## 목적과 완료 조건

운영 Supabase Security Advisor와 실제 `GRANT`·RLS·함수 정의를 기준으로 외부 호출 권한을 최소화한다. 일반 회원의 관리자 데이터 변경 가능성을 차단하고, 익명 호출이 불필요한 `SECURITY DEFINER` 함수와 트리거 함수를 외부 API에서 제거한다.

완료 조건은 다음과 같다.

- 일반 회원이 `update_artists_from_excel`을 실행해 아티스트·별칭을 변경할 수 없다.
- `refresh_festival_statuses`, `update_festival_statuses`를 익명·일반 회원이 직접 실행할 수 없다.
- 트리거 전용 함수는 외부 역할이 직접 실행할 수 없다.
- 관리자·Bot·사용자 전용 RPC는 함수 내부 역할·소유권 검사와 외부 `EXECUTE` 권한이 일치한다.
- 운영 DB 적용 후 Security Advisor와 권한 조회를 다시 실행해 결과를 기록한다.
- 기존 관리자 Excel 수정, 축제 상태 자동 갱신, 회원 개인 기록과 Discord Bot 흐름이 유지된다.

## 현재 확인 결과

- 운영 프로젝트 `festival-web`은 서울 리전, Postgres 17이며 정상 상태다.
- Security Advisor는 56건을 반환했다.
  - RLS 활성·정책 없음 3건
  - 변경 가능한 `search_path` 5건
  - `public` 스키마 확장 1건
  - 익명 실행 가능 `SECURITY DEFINER` 8건
  - 로그인 회원 실행 가능 `SECURITY DEFINER` 38건
  - 유출 비밀번호 보호 비활성 1건
- `update_artists_from_excel(jsonb)`은 `SECURITY DEFINER`이고 익명·로그인 회원에게 실행 권한이 있다. 함수 내부는 `auth.uid() is not null`만 확인해 모든 로그인 회원이 전체 아티스트·별칭을 변경할 수 있다.
- `refresh_festival_statuses()`와 레거시 `update_festival_statuses()`는 익명 실행이 가능하며 함수 내부 권한 검사가 없다.
- 감사·신규 회원·초안 기준값 설정용 트리거 함수가 외부 역할에서 직접 실행 가능하다.
- 공개·관리 테이블은 모두 RLS가 켜져 있다. 공개 테이블에 넓은 테이블 `GRANT`가 남아 있지만 쓰기 정책은 관리자에게만 열려 있어 현재 직접 쓰기는 RLS가 거부한다.
- `pipeline_runs`, `service_access_settings`, `service_access_entitlements`는 RLS 정책이 없지만 현재 정책 부재 또는 테이블 권한 회수로 외부 접근이 거부되는 fail-closed 상태다.
- 관리자 RPC 대부분은 내부 `is_admin()`, Bot RPC는 `is_festival_bot()`, 개인 기록 RPC는 `auth.uid()` 소유권을 검사한다. 다만 관리자 RPC의 `aal2` 강제는 다음 MFA 단계에서 처리한다.

## 확정 범위와 제외 범위

### 확정 범위

- `update_artists_from_excel`에 `public.is_admin()` 검사를 추가하고 익명 실행 권한을 회수한다.
- `refresh_festival_statuses`와 `update_festival_statuses`의 `public`, `anon`, `authenticated` 실행 권한을 회수한다.
- 상태 자동 갱신이 pg_cron 또는 소유자 권한으로 계속 실행되는지 확인한다.
- 다음 트리거 전용 함수의 외부 실행 권한을 회수한다.
  - `audit_artist_alias_row_change()`
  - `audit_artist_row_change()`
  - `handle_new_user()`
  - `set_festival_update_draft_base_version()`
- 관리자 wrapper가 하위 함수 검사에만 의존하는 경우 직접 관리자 검사를 추가할지 실제 호출 관계를 확인해 최소 변경한다.
- 운영 DB 함수·테이블 권한표와 Security Advisor 결과를 `SECURITY.md`와 `PROJECT_STATUS.md`에 반영한다.

### 제외 범위

- 관리자 MFA·`aal2` 강제: 다음 P0 4번에서 별도 계획으로 처리한다.
- `pg_trgm` 확장 스키마 이동: 의존 객체와 downtime 검토가 필요한 후속 작업으로 분리한다.
- 유출 비밀번호 보호: 공개 회원은 Google OAuth만 사용하므로 관리자 이메일·비밀번호 계정 영향과 Supabase 플랜 지원을 별도 확인한다.
- RLS 정책이 없는 내부 테이블에 불필요한 허용 정책을 추가하지 않는다.
- 기존 공개 SELECT 범위, Bot 데이터 흐름, 개인 기록 구조를 변경하지 않는다.
- 레거시 함수를 삭제하지 않는다. 삭제 여부는 사용처와 운영 호출 이력을 별도로 확인한 뒤 사용자가 결정한다.
- 2026년 10월 Supabase Data API 자동 노출 기본값 변경에 맞춘 전체 default privilege 전환은 별도 계획으로 진행한다.

## 예상 수정 파일·데이터 흐름

- Supabase CLI의 `migration new`로 생성한 신규 migration 2개
- 관리자 Excel 수정 RPC 보안 migration 테스트
- `SECURITY.md`
- `DATABASE.md`
- `PROJECT_STATUS.md`
- `plans/2026-08-11-saas-launch-readiness.md`

관리자 Excel 수정 화면 → `update_artists_from_excel` → 로그인 확인이 아닌 `is_admin()` 재검사 → 아티스트·별칭 변경

pg_cron/DB 소유자 → `refresh_festival_statuses` → 축제 상태 갱신. 익명·일반 회원의 Data API 직접 호출은 권한 단계에서 거부한다.

테이블 변경 → 트리거 함수 자동 실행. Data API에서 트리거 함수를 직접 호출하는 권한은 제거한다.

## 작업 순서

1. [완료] Supabase 최신 보안 지침과 2026년 Data API 권한 변경 내용을 확인한다.
2. [완료] 운영 Security Advisor, 전체 public 테이블 RLS·GRANT·정책과 `SECURITY DEFINER` 함수 권한을 읽기 전용으로 조회한다.
3. [완료] 실제 위험과 의도된 경고를 함수 내부 `is_admin()`·`is_festival_bot()`·`auth.uid()` 검사 기준으로 분류한다.
4. [완료] Supabase CLI로 신규 migration 파일 2개를 생성한다.
5. [완료] `update_artists_from_excel`을 빈 `search_path`와 정규화된 객체명으로 보강하고 `is_admin()`을 강제한다.
6. [완료] 익명 상태 갱신 함수와 트리거 전용 함수의 외부 실행 권한을 회수한다.
7. [완료] 로컬 SQL 검토와 관련 자동 테스트·타입 검사를 실행한다.
8. [완료] migration SQL을 UTF-8로 재확인한 뒤 운영 DB에 적용한다.
9. [완료] 운영 DB에서 익명·일반 회원·관리자·Bot별 허용·거부 쿼리를 재검증한다.
10. [완료] Security Advisor를 다시 실행하고 남은 경고를 수정 필요·의도된 허용·후속 검토로 기록한다.
11. [완료] 관련 보안·DB·현황 문서를 실제 결과로 갱신한다.

## 실제 결과

- 운영 DB에 `harden_rpc_execute_privileges`, `lock_legacy_status_search_path` migration을 적용하고 이력을 확인했다.
- 일반 회원의 `update_artists_from_excel` 호출은 `42501`로 거부되고 관리자는 함수 내부 입력 검증 단계까지 정상 진입했다.
- 상태 갱신 함수는 익명·일반 회원 실행을 차단하고 `service_role`만 허용했다. pg_cron 작업은 활성 상태이며 최근 실행 결과는 `succeeded`다.
- 트리거 전용 함수 4개는 `anon`, `authenticated`, `service_role`의 직접 실행을 모두 차단했다. 연결된 트리거 4개는 유지된다.
- Bot 전용 RPC는 Bot 역할만 입력 검증 단계까지 진입하고 일반 회원은 거부됐다.
- 두 일반 회원을 대입한 RLS 조회에서 다른 회원의 관심 아티스트·관심 축제·일정·기록은 모두 0건으로 확인됐다.
- Security Advisor 경고는 56건에서 41건으로 줄었고, 익명 실행 가능 `SECURITY DEFINER` 경고 8건은 0건이 됐다.
- 남은 41건은 정책 없는 fail-closed 테이블 3건, 변경 가능한 `search_path` 4건, `public`의 `pg_trgm` 1건, 내부 역할 검사 후 인증 사용자에게 제공하는 `SECURITY DEFINER` 32건, 유출 비밀번호 보호 1건이다. 관리자 `aal2`와 함께 후속 계획에서 처리한다.
- 자동 테스트 276개, 타입 검사와 변경 파일 ESLint를 통과했다.

## 회귀 위험과 검증 방법

- 관리자 Excel 수정 차단 위험: 관리자 계정 실행 성공과 일반 회원 `42501` 거부를 각각 확인한다.
- 상태 자동 갱신 중단 위험: 외부 권한 회수 후 pg_cron job과 수동 소유자 실행 결과를 확인한다.
- 트리거 중단 위험: 직접 `EXECUTE` 회수 후 아티스트 변경 감사 로그, 신규 회원 profile 생성, 초안 기준 버전 기록을 각각 확인한다.
- wrapper 우회 위험: 상위 wrapper와 하위 함수 중 하나만 호출해도 관리자 검사가 반드시 실행되는지 확인한다.
- Bot 회귀 위험: Bot 계정은 Bot 전용 RPC를 계속 실행할 수 있고 일반 회원은 같은 RPC에서 거부되는지 확인한다.
- 개인 데이터 회귀 위험: 관심·일정·페스티벌 기록 RPC가 본인 데이터에서 정상 작동하고 다른 회원 데이터는 거부되는지 확인한다.
- 권한 착시 위험: SQL Editor의 `postgres` 성공만으로 완료하지 않고 실제 JWT 역할 또는 RLS Tester로 검증한다.

## 후속 개선점

- 관리자 전체 RPC에 `aal2` 강제
- 기본 테이블·함수 권한을 opt-in 방식으로 전환
- `pg_trgm`을 전용 extension 스키마로 이동
- Google OAuth 전용 공개 회원과 이메일·비밀번호 관리자 계정의 Auth 정책 분리
- RLS Tester와 두 일반 회원 계정을 이용한 자동 회귀 테스트
