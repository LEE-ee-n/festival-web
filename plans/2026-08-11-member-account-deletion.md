# [구현 완료·운영 설정 대기] 2026-08-11 일반 회원 직접 탈퇴

## 목적과 완료 조건

일반 회원이 마이페이지에서 본인 확인 후 직접 탈퇴하고, Supabase Auth 계정과 본인 소유 개인정보가 확정된 정책대로 삭제되게 한다.

완료 조건:

- 관리자·Bot 계정은 일반 회원 탈퇴 경로를 사용할 수 없다.
- 최근 로그인 확인과 `회원탈퇴` 문구 입력을 모두 통과해야 삭제된다.
- 서버에서 요청자의 Supabase access token을 다시 검증한 뒤 Auth Admin API로 본인 계정만 삭제한다.
- `auth.users` 삭제의 `on delete cascade`로 프로필·관심·일정·페스티벌 기록·이용권과 하위 데이터가 함께 삭제된다.
- 실패 시 일부 개인 데이터만 먼저 지워지는 상태를 만들지 않는다.
- 탈퇴 완료 후 브라우저 세션을 정리하고 로그인 화면으로 이동한다.

## 확정 범위

- 마이페이지에 일반 회원용 계정 관리·탈퇴 UI 추가
- 탈퇴 전 Google 재로그인 유도와 최근 로그인 10분 이내 확인
- 확인 문구 `회원탈퇴` 입력과 최종 경고
- 서버 전용 탈퇴 API와 Supabase Auth Admin 클라이언트 추가
- 서버에서 bearer token, 현재 사용자, `profiles.role = 'user'`, 최근 로그인 시각을 재검증
- 운영 서버 전용 `SUPABASE_SECRET_KEY` 사용. 브라우저에 노출되는 `NEXT_PUBLIC_*`에는 저장하지 않는다.
- Auth 사용자 삭제 후 브라우저 세션 정리
- 개인정보처리방침의 이메일 탈퇴 안내를 직접 탈퇴 기능에 맞게 수정
- 성공·거부·실패 경로의 단위·통합 테스트

현재 운영 DB에는 일반 회원 소유 `storage.objects`가 0건이고 회원 업로드 기능도 없다. 향후 Storage 객체 때문에 Auth 삭제가 실패하면 개인 데이터를 부분 삭제하지 않고 계정 삭제 실패로 안전하게 안내한다. 회원 파일 업로드 기능을 만들 때 Storage API 삭제 절차를 별도 추가한다.

## 제외 범위

- 기존 일반 회원 2명의 실제 계정을 시험용으로 삭제하는 것
- 관리자·Bot 계정 삭제 기능
- 데이터 내보내기, 탈퇴 유예·복구, 탈퇴 이력의 별도 영구 보관
- SQL `SECURITY DEFINER` 함수에서 `auth.users`를 직접 삭제하는 방식
- 회원 소유 파일 업로드 기능과 Storage 정리 자동화
- 유료 결제·법정 보존 데이터 처리

## 예상 수정 파일·데이터 흐름

- `components/mypage/MyPageContent.tsx`
- 신규 `components/mypage/AccountDeletionSection.tsx`
- 신규 `app/api/account/delete/route.ts`
- 신규 서버 전용 Supabase Admin 클라이언트와 탈퇴 검증 모듈 `lib/auth/*` 또는 `lib/supabase/*`
- `app/login/page.tsx` 또는 기존 로그인 복귀 경로의 최소 확장
- `app/privacy/page.tsx`
- 신규 `tests/accountDeletion.test.ts`와 필요한 API 테스트
- `SECURITY.md`, `PROJECT_STATUS.md`는 다른 작업 변경과 충돌하지 않도록 구현 완료 시 최신 내용을 다시 읽고 최소 병합
- DB 구조 변경이 실제로 필요할 때만 CLI로 신규 migration을 생성하고 `DATABASE.md`를 갱신

데이터 흐름:

1. 회원이 마이페이지에서 탈퇴를 선택한다.
2. 최근 로그인 10분을 넘겼으면 Google 재로그인 후 마이페이지 탈퇴 단계로 복귀한다.
3. 회원이 경고를 확인하고 `회원탈퇴`를 입력한다.
4. 브라우저가 현재 access token을 서버 API에 전달한다.
5. 서버가 토큰의 실제 사용자, 일반 회원 역할과 최근 로그인 시각을 재검증한다.
6. 서버 전용 Auth Admin API가 해당 `auth.users` 행을 삭제한다.
7. FK cascade 결과로 개인 데이터를 삭제하고, 성공 응답 후 브라우저 세션을 정리한다.

## 작업 순서

1. 승인 후 Next.js Route Handler와 Supabase Auth Admin 최신 사용 방식을 로컬·공식 문서에서 다시 확인한다.
2. 기존 FK의 `on delete cascade`, 역할 값, Storage 소유 여부를 재확인한다.
3. 탈퇴 입력·최근 로그인·역할·오류 응답을 담당하는 공통 검증 로직과 단위 테스트를 작성한다.
4. 서버 전용 Admin 클라이언트와 탈퇴 API를 구현한다.
5. 마이페이지 탈퇴 UI와 Google 재로그인 복귀 흐름을 구현한다.
6. 개인정보처리방침과 관련 보안 문서를 실제 동작에 맞춘다.
7. 단위 테스트, API 거부 테스트, ESLint, TypeScript, 프로덕션 빌드를 실행한다.
8. 기존 회원은 삭제하지 않고 mock·비영구 시험으로 삭제 대상과 cascade를 확인한다. 실제 E2E 삭제는 별도 임시 회원이 준비된 경우에만 수행한다.
9. 계획 문서를 `[완료]`로 갱신하고 결과와 미검증 항목을 기록한다.

## 회귀 위험과 검증 방법

- 다른 사용자를 삭제할 위험: 요청 본문의 사용자 ID를 신뢰하지 않고 검증된 access token의 `user.id`만 사용한다.
- 관리자 삭제 위험: `profiles.role = 'user'`만 허용하고 관리자·Bot을 거부하는 테스트를 둔다.
- 탈취된 오래된 세션 위험: 서버에서 최근 로그인 10분 이내를 강제한다.
- 비밀키 노출 위험: 서버 전용 모듈과 환경변수만 사용하며 client bundle·Git diff·로그에 포함되지 않는지 검사한다.
- Auth 삭제 후 JWT 잔존 위험: 성공 즉시 로컬 세션을 정리하고, 이미 삭제된 사용자 ID로 개인 FK 행을 다시 만들 수 없는지 확인한다.
- 부분 삭제 위험: 개인 테이블을 API에서 순서대로 먼저 지우지 않고 Auth 사용자 삭제와 DB cascade를 사용한다.
- Storage 객체 때문에 삭제가 실패할 위험: 현재 운영 일반 회원 소유 객체 0건을 확인했다. 향후 객체가 생기면 Auth Admin 삭제가 실패하며 부분 삭제 없이 고객지원 안내를 반환한다.
- 실계정 손실 위험: 자동 시험에서 현재 운영 일반 회원 계정을 삭제하지 않는다.

## 후속 개선점

- 회원 데이터 내보내기
- 회원 업로드 도입 시 Storage API 기반 파일 삭제
- 결제 도입 시 법정 보존 데이터의 분리 보관
- 별도 임시 Google 계정으로 운영 E2E 탈퇴·재가입 시험

## 실제 구현 및 검증 결과

- 마이페이지에 계정 관리·회원탈퇴 UI를 추가했다.
- 로그인 후 10분이 지났으면 Google OAuth에 `prompt=login`을 적용해 재인증하고 탈퇴 단계로 복귀한다.
- 서버 API가 bearer token을 다시 검증하고 `profiles.role = 'user'`인 본인 계정만 처리한다.
- 모든 갱신 세션을 먼저 폐기하고 Supabase Auth Admin API로 사용자를 삭제한다.
- 서버 비밀키는 `SUPABASE_SECRET_KEY`를 우선 사용하고 기존 `SUPABASE_SERVICE_ROLE_KEY`도 호환하며 `NEXT_PUBLIC_*`에는 넣지 않는다.
- 운영 DB에서 필요한 cascade FK 9개가 모두 `ON DELETE CASCADE`이고 일반 회원 소유 Storage 객체가 0건임을 확인했다.
- 탈퇴 검증 테스트 5개를 포함한 전체 테스트 291개, TypeScript 검사와 변경 파일 ESLint 오류 0개가 통과했다.
- 프로덕션 빌드는 컴파일과 TypeScript까지 통과했다. 정적 페이지 생성은 작업 환경이 `.env.local` 읽기를 차단해 중단됐으며 사용자의 일반 터미널 재검증이 필요하다.
- 실제 기존 회원 계정은 삭제하지 않았다. 운영 E2E는 임시 Google 회원을 준비한 경우에만 진행한다.
- 배포 전에 Vercel 서버 환경변수에 `SUPABASE_SECRET_KEY` 또는 `SUPABASE_SERVICE_ROLE_KEY`를 설정해야 한다.
