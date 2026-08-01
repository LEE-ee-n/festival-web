# [구현·운영 DB 적용 완료·실제 검증 대기] Discord 중복 출처 임시 작업 삭제 후 재등록

## 목적과 완료 조건

- Bot이 같은 Instagram URL 또는 Discord 첨부 출처의 기존 임시 작업을 발견하면 `기존 삭제 후 재등록` 버튼을 제공한다.
- 허용된 사용자가 버튼을 누르면 해당 출처의 검수 대기 작업만 삭제하고 원본 메시지를 다시 분석해 새 임시 작업을 만든다.
- 승인 완료 이력과 정식 페스티벌 데이터는 삭제하거나 변경하지 않는다.

## 확정 범위

- `festival_candidates.status = 'pending'` 또는 `festival_update_drafts.status = 'pending'`인 Bot 생성 작업만 교체 대상으로 삼는다.
- 승인·반려·최종 반영된 작업만 존재하면 버튼을 표시하지 않고 관리자 화면 링크만 안내한다.
- 버튼은 허용된 Discord 사용자만 실행할 수 있다.
- 버튼 클릭 시 원본 사용자 메시지를 다시 가져와 Instagram URL 또는 `신규등록` 첨부 흐름을 재사용한다.
- 삭제 대상의 임시 포스터 Storage 경로도 함께 정리하며 새 작업은 충돌하지 않는 새 작업 ID로 저장한다.
- 삭제와 신규 저장 사이에 실패하면 Discord에 실패 상태를 남기고 임의로 정식 데이터를 변경하지 않는다.

## 제외 범위

- 승인 완료 후보·감사 이력 삭제
- 정식 `festivals`, 아티스트, 라인업, 티켓 삭제
- 관리자 화면의 삭제 동작 변경
- 서로 다른 출처 URL의 중복 축제 자동 병합
- 재등록 자동 실행 또는 시간 기반 자동 삭제

## 예상 수정 파일과 데이터 흐름

- `operations/discord-instagram-bot/src/bot.js`
  - 중복 상태 판정, 위험 버튼, 원본 메시지 재조회, 삭제 RPC와 재수집 흐름 연결
- `operations/discord-instagram-bot/src/discordReplacement.js`
  - 교체 가능 상태와 버튼 식별값 판정을 순수 함수로 분리
- `operations/discord-instagram-bot/tests/discordReplacement.test.js`
  - pending만 허용, 승인 이력 보호, 버튼 ID 판정 테스트
- `operations/discord-instagram-bot/scripts/copy-to-runtime.cmd`, `README.md`
  - 신규 모듈 복사와 운영 방법 반영
- `supabase/migrations/050_replace_pending_discord_source_draft.sql`
  - Bot만 실행 가능한 pending 출처 작업 삭제 RPC와 Bot 소유 임시 포스터 삭제 정책 추가
- `DATABASE.md`, `FESTIVAL_INGESTION_FLOW.md`, `PROJECT_STATUS.md`
  - 삭제 범위와 실제 적용 상태 기록

데이터 흐름:

`중복 출처 발견` → pending 여부 확인 → 위험 버튼 표시 → 사용자 클릭 → pending 임시 작업 삭제 → 임시 포스터 정리 → 원본 메시지 재분석 → 새 임시 작업 저장

## 작업 순서

1. 교체 가능 상태와 버튼 ID 판정 모듈·테스트를 추가한다.
2. 중복 응답에 pending일 때만 위험 버튼을 표시한다.
3. 버튼 클릭 시 원본 메시지를 조회하고 기존 Instagram·첨부 처리 흐름을 재사용한다.
4. pending 작업만 삭제하는 Migration 050과 Storage 삭제 정책을 작성한다.
5. 복사 스크립트와 관련 문서를 갱신한다.
6. Bot 테스트, 구문 검사, 린트와 웹 회귀 검사를 실행한다.
7. 사용자가 Migration 050을 운영 DB에 적용하고 Bot을 다시 복사·실행한다.
8. pending 중복 1건과 승인 완료 중복 1건으로 실제 보호 동작을 확인한다.

## 회귀 위험과 검증 방법

- 승인 이력 삭제 위험: RPC에서 pending 상태와 Bot 생성자 조건을 잠금 후 재검사한다.
- 다른 사용자의 실행 위험: Discord 사용자 ID와 DB Bot 역할을 각각 확인한다.
- 클릭 중 중복 실행 위험: 행 잠금과 버튼 제거, 원본 출처의 중복 제약으로 두 번째 실행을 중단한다.
- Storage 고아 파일 위험: 삭제 RPC가 반환한 경로만 Bot 소유 폴더 정책으로 정리하고 실패를 로그에 남긴다.
- 기존 수집 회귀 위험: 재등록은 기존 Instagram·첨부 추출 함수를 호출하고 전체 Bot 테스트를 실행한다.

## 후속 개선점

- 운영 중 Storage 정리 실패가 누적되면 Bot 소유 고아 임시 포스터 점검 도구를 별도 계획으로 검토한다.

## 실제 구현 결과

- 동일 출처의 Bot 생성 작업이 모두 pending일 때만 `기존 삭제 후 재등록` 위험 버튼을 표시한다.
- 버튼은 원본 Discord 메시지 ID를 검증해 보존하고 허용된 사용자만 실행할 수 있다.
- Migration 050 RPC는 관련 행을 잠근 뒤 pending·Bot 생성자 조건을 다시 검사하고, 보호 이력이 있으면 삭제 전체를 중단한다.
- 삭제한 후보의 임시 포스터 경로를 반환해 Bot 소유 Storage 폴더에서 정리하고 새 작업 ID로 기존 Instagram·첨부 흐름을 재실행한다.
- Bot 테스트 30개, Node 구문 검사, 변경 파일 ESLint, 웹 테스트 173개와 타입 검사가 통과했다.
- Migration 050 운영 DB 적용 후 RPC의 authenticated 전용 실행 권한, anon 차단, 보호 이력 검사와 Bot 전용 SELECT·DELETE 정책을 확인했다.
- 실행용 Bot 복사와 실제 pending·승인 이력 보호 검증은 남아 있다.
