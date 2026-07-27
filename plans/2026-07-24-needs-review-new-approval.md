# 판별 확인 후보의 신규 등록 확정 계획

- 작성일: 2026-07-24
- 상태: 구현 완료·운영 DB 적용 대기
- 승인일: 2026-07-24
- 대상: `festival_candidates.work_type = needs_review` 후보의 최종 신규 등록
- DB 변경: 있음

## 목적

- 관리자가 5단계 검토를 마치고 `페스티벌 등록 확정`을 누르면 `needs_review` 후보를 신규 축제로 등록할 수 있게 한다.
- 최종 등록 트랜잭션 안에서 후보의 `work_type`을 `new`로 확정한다.

## 확정 범위

1. `approve_new_festival_candidate`가 `new`와 `needs_review` 후보를 승인할 수 있게 한다.
2. `needs_review` 후보는 최종 입력값의 축제명·`normalized_name`·시작일·종료일 검증을 모두 통과해야 한다.
3. 같은 `normalized_name + start_date + end_date`의 기존 축제가 있으면 기존 중복 차단을 유지한다.
4. 신규 축제 등록과 후보 상태 변경을 한 RPC 트랜잭션에서 처리한다.
5. 등록 성공 시 후보의 `work_type`과 `comparison_json.work_type`을 `new`로 기록한다.
6. RPC 실패 시 `needs_review` 상태와 운영 데이터 변경을 모두 롤백한다.

## 예상 수정 파일

- `supabase/migrations/042_approve_needs_review_as_new.sql`
- `DATABASE.md`
- `FESTIVAL_INGESTION_FLOW.md`
- `PROJECT_STATUS.md`
- 이 계획 문서

## 작업 순서

- [x] Migration 042에서 원자 승인 RPC를 추가한다.
- [x] 최종 검증·중복 차단·감사 로그·원자 처리를 유지한다.
- [x] 성공한 후보의 `work_type`과 비교 메타데이터를 `new`로 확정한다.
- [x] SQL을 UTF-8로 다시 확인한다.
- [x] 관련 문서와 상태를 갱신한다.
- [x] 전체 테스트와 typecheck를 실행한다.
- [ ] 운영 DB에 Migration 042를 적용한다.
- [ ] 실제 `needs_review` 후보의 최종 등록 성공을 확인한다.

## 유지할 규칙

- `update` 후보는 신규 등록 RPC로 승인하지 않는다.
- 기존 축제와 식별값이 완전히 같으면 신규 등록하지 않는다.
- 날짜·이름을 자동 추론하거나 자동 보정하지 않는다.
- 신규 등록과 기존 수정 흐름을 섞지 않는다.
- 축제·아티스트·티켓·감사 로그·후보 상태는 한 트랜잭션으로 처리한다.

## 예외 상황·회귀 위험

- 관리자가 입력한 식별값이 기존 축제와 같으면 중복 오류를 표시하고 등록하지 않는다.
- RPC 중간 실패 시 후보만 `new`로 바뀌거나 운영 축제만 생성되지 않도록 최종 성공 트랜잭션 안에서 상태를 변경한다.
- 이미 승인된 후보와 `update` 후보는 기존 오류를 유지한다.

## 검증 항목

- `new` 후보의 기존 승인 동작 유지
- `needs_review` 후보의 신규 승인 성공
- `update` 후보 승인 거부
- 날짜·`normalized_name` 누락 후보 승인 거부
- 기존 축제 식별값 중복 승인 거부
- 성공 후 후보 `status = approved`, `work_type = new`, `festival_id` 기록
- 실패 시 후보와 운영 데이터 롤백
- 전체 테스트와 typecheck 통과

## 완료 조건

- 화면에서 별도 DB 직접 수정 없이 `needs_review` 후보를 최종 신규 등록할 수 있다.
- 기존 중복 차단과 최종 필수정보 검증이 유지된다.
- 운영 DB 적용과 실제 후보 등록을 확인한다.

## 제외 범위

- `needs_review` 후보를 기존 축제 수정 작업으로 전환하는 UI
- 자동 신규·기존 재판정
- Discord Bot의 최초 분류 기준 변경
- 기존 후보 일괄 데이터 수정

## 후속 개선점·참고사항

- `needs_review`를 기존 축제 수정으로 보내야 하는 경우의 관리자 선택 UI는 별도 계획으로 남긴다.
