# [진행 중] 단일 관리자 TOTP MFA·aal2 강제

## 목적과 완료 조건

Festibom의 단일 관리자 계정에 TOTP MFA를 등록하고, 관리자 화면뿐 아니라 운영 DB의 공통 관리자 판별 함수에서도 `aal2`를 요구한다.

완료 조건은 다음과 같다.

- 비밀번호 로그인 후 등록된 TOTP가 없으면 QR 등록 화면, 있으면 인증 코드 화면으로 이동한다.
- 일반 회원은 관리자 MFA 등록·인증 흐름에 진입할 수 없다.
- `aal1` 관리자 세션은 관리자 화면과 관리자 RLS·RPC에서 거부된다.
- TOTP 검증으로 갱신된 `aal2` 관리자 세션만 관리자 화면과 DB 변경을 수행할 수 있다.
- 운영 관리자 1명이 실제 TOTP 등록과 재로그인을 완료한다.
- 기존 Bot, 일반 회원 개인 기능과 pg_cron은 영향을 받지 않는다.

## 현재 확인 결과

- 운영 DB에는 관리자 프로필이 1개만 존재한다.
- 해당 관리자에게 등록된 verified·unverified TOTP factor는 모두 0개다.
- `public.is_admin()`은 현재 `profiles.role = 'admin'`만 확인하며 세션의 `aal`은 확인하지 않는다.
- 운영 RLS 정책 36개와 public 함수 24개가 `is_admin()`을 공통 관리자 관문으로 사용한다.
- 관리자 로그인은 이메일·비밀번호 로그인 후 곧바로 `is_admin()`을 호출한다.
- Supabase 공식 지침은 UI만이 아니라 DB 정책·API에서도 JWT의 `aal = 'aal2'`를 강제하도록 안내한다.

## 확정 범위와 제외 범위

### 확정 범위

- 관리자 로그인 화면에 TOTP 최초 등록과 재로그인 challenge·verify 흐름을 추가한다.
- 로그인된 사용자는 본인 `profiles.role`만 읽을 수 있는 기존 RLS를 이용해 관리자 역할을 먼저 판별한다.
- `getAuthenticatorAssuranceLevel()`과 verified TOTP factor 상태로 등록·인증·완료 화면을 분기한다.
- `public.is_admin()`에 `profiles.role = 'admin'`과 JWT `aal = 'aal2'` 조건을 함께 적용한다.
- `aal1` 관리자와 `aal2` 관리자, 일반 회원, Bot의 관리자 RLS·RPC 허용·거부를 운영 DB에서 검증한다.
- MFA 실패·취소 시 관리자 데이터는 노출하지 않고 안전하게 로그아웃하거나 로그인 화면에 머문다.

### 제외 범위

- 일반 회원 MFA
- SMS·WhatsApp MFA와 복수 TOTP 기기 관리
- 관리자 이메일·비밀번호 변경, 계정 복구 자동화
- Supabase Dashboard에서 관리자가 직접 수행해야 하는 factor 강제 삭제
- Bot 계정 MFA. Bot은 사용자 관리자 권한과 분리된 기존 `is_festival_bot()` 경계를 유지한다.

## 예상 수정 파일·데이터 흐름

- `app/admin/login/page.tsx`
- 관리자 MFA 등록·인증용 신규 컴포넌트 또는 hook
- `lib/auth/getCurrentAdminAccess.ts`와 관리자 역할·AAL 판별 helper
- Supabase CLI로 생성하는 신규 migration 1개
- 관련 인증·migration 단위 테스트
- `SECURITY.md`, `DATABASE.md`, `PROJECT_STATUS.md`
- 이 계획서와 상위 SaaS 준비 계획

비밀번호 로그인 → 본인 profile의 관리자 역할 확인 → 현재·다음 AAL 확인 → TOTP 미등록이면 QR 등록 및 코드 검증 / 등록 상태면 challenge 및 코드 검증 → 세션이 `aal2`로 갱신 → `is_admin()` 성공 → 관리자 화면과 RLS·RPC 허용

## 배포·잠금 순서

1. MFA 등록·challenge UI와 테스트를 먼저 구현한다.
2. 프로덕션 빌드와 localhost 관리자 로그인 분기를 검증한다.
3. UI를 운영에 먼저 배포한다. 이 시점에는 기존 DB 관리자 판별을 유지한다.
4. 사용자가 운영 관리자 계정으로 로그인해 인증 앱으로 QR을 스캔하고 최초 TOTP 등록을 완료한다.
5. verified TOTP factor와 `aal2` 세션을 확인한 뒤 `is_admin()` 보강 migration을 운영 DB에 적용한다.
6. 새 로그인에서 비밀번호만 통과한 `aal1` 세션의 관리자 DB 접근 거부와 TOTP 완료 후 허용을 검증한다.

DB 잠금은 4번 확인 전 적용하지 않는다. 이 순서는 관리자 계정 잠금을 방지하기 위한 필수 안전장치다.

## 작업 순서

1. [완료] Supabase 최신 MFA 문서와 현재 관리자 로그인·RLS·RPC 구조를 확인한다.
2. [완료] 운영 관리자 수와 TOTP factor 현황, `is_admin()` 영향 범위를 개인정보 없이 집계한다.
3. [완료] 관리자 역할과 AAL 상태를 분리해 반환하는 인증 helper를 설계한다.
4. [완료] TOTP 최초 등록·challenge·verify UI를 구현한다.
5. [완료] 관리자 layout이 `aal1` 관리자를 홈이 아닌 MFA 로그인 화면으로 보내도록 보강한다.
6. [완료] Supabase CLI로 `is_admin()`의 `aal2` 조건 migration을 생성한다. 운영 DB에는 적용하지 않았다.
7. [완료] 자동 테스트 281개, 타입 검사, ESLint 오류 0개와 사용자 환경 프로덕션 빌드 29개 경로 성공을 확인했다.
8. [ ] UI 변경을 운영에 먼저 배포한다.
9. [사용자 확인] 운영 관리자 계정에 TOTP를 등록하고 복구 정보를 안전한 오프라인 장소에 보관한다.
10. [ ] verified factor와 `aal2`를 확인한 뒤 운영 DB migration을 적용한다.
11. [ ] `aal1`·`aal2` 관리자, 일반 회원과 Bot 회귀를 검증하고 문서를 완료 상태로 갱신한다.

## 현재 구현 결과

- 비밀번호 로그인 후 관리자 역할과 현재 AAL을 분리해 확인한다.
- verified TOTP가 없으면 최초 QR 등록, 있으면 6자리 challenge 화면을 표시한다.
- 기존 `aal2` 세션은 추가 코드를 묻지 않고 관리자 화면으로 이동한다.
- 일반 회원은 관리자 MFA 흐름에 진입하지 않고 로그아웃 처리된다.
- 미완료 TOTP factor는 사용자가 새 등록을 시작할 때 정리한 뒤 하나만 생성한다.
- `is_admin()`이 `role = 'admin'`과 JWT `aal = 'aal2'`를 함께 요구하는 migration 파일을 준비했다.
- 관리자 TOTP가 아직 0개이므로 운영 DB migration은 안전장치에 따라 미적용 상태다.
- 사용자 환경에서 Next.js 프로덕션 빌드의 컴파일, TypeScript, 페이지 데이터 수집과 정적 페이지 29개 생성을 확인했다.

## 회귀 위험과 검증 방법

- 관리자 잠금 위험: verified factor 확인 전 DB `aal2` 강제를 적용하지 않는다.
- 일반 회원 우회 위험: MFA API 호출 가능 여부와 관리자 역할은 별개로 두며 본인 profile이 admin인 경우에만 관리자 MFA 화면을 제공한다.
- UI 우회 위험: 브라우저 화면과 무관하게 `is_admin()`이 JWT `aal2`를 재검사한다.
- 세션 갱신 위험: TOTP verify 후 AAL을 다시 조회하고 `aal2`가 아니면 관리자 화면으로 이동하지 않는다.
- 미완료 factor 위험: unverified factor가 남으면 새 factor를 무한 생성하지 않고 정리 또는 재시도 경로를 제공한다.
- Bot 회귀 위험: Bot 전용 RPC와 pg_cron 성공 여부를 별도로 확인한다.
- 단일 관리자 위험: 실제 등록 후 인증 앱 분실에 대비한 복구 절차를 문서화하되 자동 우회 계정은 만들지 않는다.

## 후속 개선점

- 관리자 로그인 rate limit·CAPTCHA
- 관리자 세션 최대 수명과 최근 TOTP 인증 시간 제한
- 관리자 로그인·MFA 실패 탐지 알림
- 인증 앱 분실 시 Supabase Dashboard를 이용한 수동 복구 절차와 복구 훈련
