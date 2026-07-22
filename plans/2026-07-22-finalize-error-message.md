# [완료] 기존 페스티벌 최종 반영 오류 문구 보존 계획

- 작성일: 2026-07-22
- 상태: 완료
- 승인일: 2026-07-22
- 대상: 기존 페스티벌 수정 최종 RPC 오류 처리
- DB 변경: 없음

## 요약

- 현재 Supabase RPC 오류는 일반 `Error` 객체가 아니어서 실제 메시지가 사라지고 `최종 반영에 실패했습니다.`만 표시된다.
- RPC의 `error.message`를 일반 `Error`로 변환해 기존 화면 오류 영역에 실제 DB 원인을 표시한다.

## 구현 범위

1. `finalize_festival_update_draft` 응답에 오류가 있으면 `new Error(error.message)`를 발생시킨다.
2. 기존 `catch`와 화면 오류 영역을 그대로 사용한다.
3. 최종 저장 데이터·RPC 인자·트랜잭션·재시도 동작은 변경하지 않는다.

## 수정 파일

- `app/admin/festivals/import-json/StagedFestivalUpdate.tsx`
- 이 계획 문서와 `PROJECT_STATUS.md`

## 검증·완료 조건

- typecheck와 변경 파일 ESLint 통과
- 재시도 시 일반 실패 문구가 아니라 DB의 실제 오류 메시지 표시
- 실제 메시지를 확인한 뒤 원인 수정은 별도 판단

## 제외 범위

- 아직 확인되지 않은 DB 오류 원인의 추측 수정
- RPC·DB 변경

## 후속 개선점·참고사항

- 실제 DB 메시지를 확인한 뒤 필요한 수정 범위를 결정한다.

## 진행 결과

- [x] RPC의 `error.message`를 일반 `Error`로 변환
- [x] 기존 화면 오류 영역과 저장 로직 유지
- [x] typecheck와 변경 파일 ESLint 통과
- [x] 최종 확정 재시도 후 실제 DB 오류 `Artist name is empty.` 확인
