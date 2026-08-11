# [완료] 2026-08-11 유사 후보 기존 수정 전환 RLS 오류 수정

## 목적과 완료 조건

유사 축제 후보에서 `기존 축제로 수정`을 선택할 때 `festival_update_drafts` INSERT가 RLS에 막히는 오류를 수정한다.

완료 조건:

- 관리자 계정만 기존 수정 초안을 생성할 수 있다.
- 신규 후보가 기존 수정 초안으로 전환되고 원래 신규 후보는 삭제된다.
- 전환 실패 시 생성된 수정 초안은 되돌리고 신규 후보는 보존한다.
- 일반 회원은 수정 초안을 생성할 수 없다.

## 확인된 원인

- 전환 코드는 로그인한 관리자 브라우저에서 `festival_update_drafts`에 직접 INSERT한다.
- 현재 RLS에는 관리자 SELECT·UPDATE·DELETE 정책만 있고 INSERT 정책이 없다.
- 실제 브라우저 테스트에서 `new row violates row-level security policy for table "festival_update_drafts"`를 확인했다.

## 확정 범위

- CLI로 생성한 migration `20260811061625_admin_insert_festival_update_drafts.sql`에서 `authenticated` 관리자에게만 INSERT를 허용하는 정책을 추가한다.
- 정책 조건은 기존 관리자 정책과 동일하게 `public.is_admin()`을 사용한다.
- 기존 전환 순서인 `수정 초안 생성 → 신규 후보 삭제 → 실패 시 초안 롤백`은 유지한다.
- `DATABASE.md`, `PROJECT_STATUS.md`에 정책과 적용 상태를 기록한다.

## 제외 범위

- Discord Bot 전용 초안 생성 RPC 변경
- 일반 회원 권한 변경
- 기존 축제 데이터의 최종 반영
- 유사도 계산 규칙 변경

## 예상 수정 파일

- `supabase/migrations/20260811061625_admin_insert_festival_update_drafts.sql`
- `DATABASE.md`
- `PROJECT_STATUS.md`
- 이 계획 문서

## 작업 순서

1. 기존 정책 이름과 `public.is_admin()` 사용 방식을 재확인한다.
2. 관리자 전용 INSERT RLS 정책 migration을 작성한다.
3. SQL을 UTF-8로 다시 읽어 문법과 권한 범위를 확인한다.
4. 관련 테스트·TypeScript·ESLint·`git diff --check`를 실행한다.
5. 사용자가 운영 DB에 migration을 적용한다.
6. 관리자 브라우저에서 유사 후보를 기존 수정으로 전환하고 생성·원본 후보 삭제·수정 초안 삭제까지 재검증한다.

## 회귀 위험과 검증

- INSERT 정책 범위가 넓으면 일반 회원이 수정 초안을 만들 수 있다.
- `with check (public.is_admin())`로 관리자만 허용하고 일반 회원 RLS 검증을 별도로 남긴다.
- migration 작성만으로 운영 DB 적용 완료로 보지 않는다.
- 운영 적용 전에는 브라우저 재시험을 완료로 표시하지 않는다.

## 후속 개선점

- 후보 전환의 INSERT·DELETE를 하나의 관리자 RPC 트랜잭션으로 묶는 방안을 별도 검토한다.

## 현재 진행 결과

- [완료] Supabase CLI로 migration 파일을 생성하고 관리자 전용 INSERT 정책을 작성했다.
- [완료] 운영 `festival-web` DB에 migration을 적용했다.
- [완료] 운영 `pg_policies`에서 `authenticated` INSERT와 `with check ((select is_admin()))`를 확인했다.
- [완료] 정책 회귀 테스트를 추가하고 전체 테스트 282개, TypeScript 검사, ESLint 오류 0개와 `git diff --check`를 통과했다.
- [완료] 사용자 실행 localhost에서 테스트 후보를 기존 축제 `#98`의 수정 초안 `#28`로 전환했다.
- [완료] 원본 신규 후보가 0건으로 삭제되고 수정 초안이 1건 생성된 것을 확인했다.
- [완료] 수정 초안을 화면에서 삭제하고 후보·수정 초안이 모두 0건인 것을 운영 DB에서 확인했다.
- [완료] 기존 페스티벌의 운영 데이터는 최종 반영하지 않았다.
