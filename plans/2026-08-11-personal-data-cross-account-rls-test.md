# [완료] 2026-08-11 개인 데이터 INSERT·UPDATE·DELETE 교차 계정 RLS 시험

## 목적과 완료 조건

운영 DB의 서로 다른 일반 회원 A·B를 인증된 사용자로 모의하여, A가 B의 개인 데이터에 INSERT·UPDATE·DELETE할 수 없고 본인 데이터에는 정해진 작업만 수행할 수 있는지 실제 `GRANT + RLS + RPC` 조합으로 검증한다.

완료 조건:

- 개인 데이터 테이블 전체의 교차 계정 INSERT·UPDATE·DELETE 거부를 확인한다.
- 정보 유출의 선행 조건인 교차 SELECT 거부도 함께 확인한다.
- 본인 작업의 정상 허용과 원래 미지원인 작업의 권한 거부를 구분한다.
- `save_user_festival_record`, `save_user_festival_artist_record` RPC가 다른 회원의 기록을 수정하지 못한다.
- 운영 시험 데이터는 하나의 transaction 안에서 만들고 전부 rollback하여 남기지 않는다.
- 결과에는 회원 UUID·이메일·메모 등 실제 개인정보를 출력하지 않고 표별 PASS/FAIL만 남긴다.

## 확정 범위

시험 대상:

- `profiles`
- `user_favorite_artists`
- `user_favorite_festivals`
- `user_schedule_items`
- `user_festival_diaries`
- `user_festival_performances`
- `user_festival_songs`
- `user_festival_media`
- `service_access_entitlements`
- `save_user_festival_record`
- `save_user_festival_artist_record`

현재 운영 권한 기준:

- `profiles`는 일반 회원 SELECT만 허용한다.
- 관심 아티스트·축제와 일정은 SELECT·INSERT·DELETE만 허용하며 UPDATE는 권한 단계에서 거부한다.
- 페스티벌 일지는 SELECT·INSERT·UPDATE·DELETE가 직접 허용되며 애플리케이션의 통합 수정은 RPC 흐름을 사용한다.
- 일지 하위 공연·곡·미디어는 SELECT·INSERT·UPDATE·DELETE가 허용되지만 부모 일지 소유권 RLS를 통과해야 한다.
- 이용권은 일반 회원의 직접 SELECT·INSERT·UPDATE·DELETE를 모두 거부한다.

각 테이블은 이 의도된 권한과 교차 계정 차단을 모두 시험한다. 사용자가 요청한 쓰기 시험이 중심이며 SELECT는 데이터 노출 방지와 UPDATE RLS의 전제 확인을 위해 포함한다.

## 제외 범위

- 브라우저에서 두 회원의 비밀번호·Google 세션·JWT를 복사하는 방식
- 실제 회원 데이터의 변경 또는 삭제를 커밋하는 시험
- 관리자 MFA·관리자 RPC·Bot 권한의 재시험
- 공개 축제·아티스트 데이터의 내용 정확성 시험
- 발견된 문제와 무관한 RLS 구조 개편

## 예상 수정 파일·데이터 흐름

- 신규 `supabase/tests/personal_data_cross_account_rls.sql`
- 신규 `tests/personalDataRlsTest.test.ts` 또는 기존 migration 보안 테스트의 최소 확장
- 정책 결함이 발견된 경우에만 Supabase CLI로 생성한 신규 `supabase/migrations/*_fix_personal_data_rls.sql`
- DB 변경이 생긴 경우 `DATABASE.md`
- `SECURITY.md`, `PROJECT_STATUS.md`는 다른 작업 변경과 충돌하지 않도록 완료 시 최신 내용을 다시 읽고 최소 병합
- 이 계획 문서

시험 흐름:

1. 운영 DB에서 역할이 `user`인 서로 다른 두 회원 UUID를 내부 변수 A·B에만 담는다.
2. transaction을 시작하고 시험에 필요한 기존 승인 축제·아티스트를 선택한다.
3. 권한 있는 준비 단계에서 식별 가능한 시험 행을 만들거나 기존 행을 건드리지 않는 최소 fixture를 구성한다.
4. `SET LOCAL ROLE authenticated`와 JWT claim의 `sub`를 A로 설정한다.
5. A 본인 행의 허용 작업과 B 행의 SELECT·INSERT·UPDATE·DELETE 거부를 확인한다.
6. A·B를 바꿔 동일 경계를 재확인하고 두 개인 기록 RPC의 교차 수정 거부를 확인한다.
7. 예외가 하나라도 발생하면 안전하게 실패시키고 transaction 전체를 rollback한다.
8. 결과는 테이블·작업·기대 결과·PASS/FAIL만 출력한다.

## 작업 순서

1. 회원탈퇴 구현과 검증을 먼저 끝낸다.
2. 운영 DB의 정책, table privilege, 함수 실행 권한과 두 일반 회원 존재를 재확인한다.
3. 테이블별 허용·거부 matrix를 SQL 테스트로 작성한다.
4. 로컬 정적 테스트로 대상 테이블·작업·rollback·개인정보 비출력 조건을 검사한다.
5. SQL을 UTF-8로 다시 읽어 한글·따옴표를 확인한다.
6. 운영 DB에서 transaction/rollback 방식으로 교차 계정 시험을 실행한다.
7. 모두 통과하면 Supabase Security Advisor를 다시 확인한다.
8. 정책 결함이 발견되면 이 계획 범위 안에서 해당 개인 테이블의 최소 policy·grant만 수정한다. CLI로 migration을 생성하고 운영 적용 후 전체 matrix를 다시 실행한다.
9. 예상하지 못한 스키마 변경이나 데이터 손실 가능성이 발견되면 임의 수정하지 않고 계획을 갱신해 다시 보고한다.
10. 계획 문서를 `[완료]`로 갱신하고 실제 PASS/FAIL과 migration 적용 여부를 기록한다.

## 회귀 위험과 검증 방법

- RLS만 보고 GRANT 누락을 놓칠 위험: `has_table_privilege`와 실제 DML을 함께 확인한다.
- UPDATE 정책만 보고 SELECT 전제를 놓칠 위험: SELECT, `USING`, `WITH CHECK`를 각각 시험한다.
- 0행 UPDATE·DELETE를 성공으로 오판할 위험: 영향 행 수와 사후 행 상태를 검사한다.
- 자기 행의 `user_id`를 B로 바꾸는 우회: 허용된 UPDATE 대상에서 소유자 변경을 별도로 시도한다.
- 하위 행에서 부모 일지를 바꾸는 우회: 공연·곡·미디어의 부모 diary를 B 소유로 지정하거나 변경하는 시도를 포함한다.
- RPC 우회: 본문 ID를 B의 기록으로 주고 함수가 거부하거나 0건 처리하는지, B 데이터가 그대로인지 확인한다.
- 운영 데이터 오염: 모든 fixture와 DML을 단일 transaction 안에서 실행하고 마지막에 강제 rollback 및 잔존 0건을 확인한다.
- 개인정보 노출: SQL 결과와 문서에는 실사용자 식별자·콘텐츠를 출력하지 않는다.

## 후속 개선점

- CI에서 임시 Supabase 환경을 사용한 RLS 회귀 시험 자동화
- 신규 개인 테이블·RPC 추가 시 matrix 등록을 강제하는 체크리스트
- 별도 테스트 계정으로 브라우저 세션까지 포함한 E2E 권한 시험

## 실제 실행 결과

- 운영 DB의 일반 회원 2명을 내부 UUID로만 사용해 양방향 시험했다.
- 개인 테이블 9개와 `save_user_festival_record`, `save_user_festival_artist_record` RPC 2개의 교차 SELECT·INSERT·UPDATE·DELETE 차단이 모두 통과했다.
- 본인 행의 의도된 허용 작업과 관심·일정 등 미지원 UPDATE의 table privilege 거부도 함께 통과했다.
- 페스티벌 기록 직접 UPDATE는 허용되지만 `USING`과 `WITH CHECK`로 본인 행에만 제한되는 실제 동작을 확인했다.
- 모든 fixture와 DML은 transaction에서 rollback됐으며 결과의 `persistent_test_rows`는 0건이다.
- 정책 결함이 발견되지 않아 RLS 수정 migration은 만들거나 운영 DB에 적용하지 않았다.
- 재사용 가능한 SQL 시험 파일과 정적 회귀 테스트 4개를 추가했다.
- 시험 추가 후 전체 테스트 291개와 TypeScript 검사가 통과했다.
- Supabase Security Advisor를 재확인했으며 이번 작업으로 새 DB 객체나 경고는 추가되지 않았다. 기존 Advisor 항목은 별도 보안 계획 범위다.
