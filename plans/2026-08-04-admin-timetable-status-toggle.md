# [완료] 2026-08-04 페스티벌 관리 타임테이블 상태 변경

결과: 라인업 탭 상단에 토글 추가, 기존 RPC 본문 확장(Migration 052 작성). 테스트 193개·타입 검사·변경 파일 ESLint 통과. 운영 DB 052 적용 완료(사용자 확인). `DATABASE.md` 갱신 완료. 토글 실제 저장·감사 기록·공개 화면 반영 확인만 남음.

## 목적과 완료 조건

페스티벌 관리 화면(`/admin/festivals/[id]/lineup`)에서 등록 이후에도 `festivals.timetable_status`를 변경할 수 있도록 토글을 추가한다.

완료 조건:

1. 라인업 탭에 `TimetableVisibilityToggle`이 표시되고 현재 DB 값을 반영한다.
2. 토글 클릭 → 확인 → 기존 `update_festival_basic_info_with_audit` RPC로 즉시 저장되고 감사 로그에 기록된다.
3. 기본정보 저장 흐름은 timetable_status를 건드리지 않는다(payload 키 미포함 → DB 값 유지).

## 확정 범위와 제외 범위

- 기존 `festivals.timetable_status` 컬럼을 그대로 사용한다. 새 테이블·컬럼·RPC 없음.
- Migration 052는 기존 `update_festival_basic_info_with_audit(bigint, jsonb)`의 함수 본문만 교체해 선택적 `timetable_status` 키를 처리한다(서명 동일 → 타입 재생성 불필요).
- 후보 승인 트리거(039)와 기존 수정 흐름은 변경하지 않는다.

## 예상 수정 파일·데이터 흐름

- `supabase/migrations/052_festival_timetable_status_admin_update.sql` (신규)
- `lib/festivals/updateFestivalBasicInfo.ts` — input에 선택적 `timetableStatus` 추가
- `lib/festivals/festivalBasicInfoPayload.ts` — 키가 있을 때만 `timetable_status` 포함
- `lib/festivals/getFestivalLineupData.ts` — select에 `timetable_status` 추가
- `app/admin/festivals/[id]/lineup/hooks/useFestivalBasicInfo.ts` — 상태·초기화·`saveTimetableStatus`
- `app/admin/festivals/[id]/lineup/page.tsx` — 라인업 탭 상단 토글 섹션
- `components/admin/TimetableVisibilityToggle.tsx` — disabled prop 추가
- `tests/festivalBasicInfoPayload.test.ts` — 포함/제외 테스트

흐름: 화면 로드(getFestivalLineupData) → 훅 상태 → 토글 클릭 → 확인 창 → updateFestivalBasicInfo(전체 payload + timetable_status) → RPC가 컬럼 갱신 + 감사 이벤트 → 성공 알림 + 상태 갱신.

## 작업 순서

1. Migration 052 작성.
2. lib·훅·화면·테스트 수정.
3. `npm test`, `npm run typecheck`, 변경 파일 ESLint.
4. 계획 완료 표시, PROJECT_STATUS 갱신.

## 회귀 위험과 검증 방법

- 위험: RPC가 전체 필드를 덮어쓰므로 토글 저장 시 보내는 payload가 현재 화면 상태와 일치해야 한다. → 로드된 상태 그대로 전송하며, 기본정보 저장은 키를 보내지 않아 상태 변경 없음.
- 위험: 운영 DB에 052 적용 전에는 토글 저장이 실패한다(함수가 키를 무시하지 않고 본문 교체 전이라 컬럼 미갱신). → 적용 전까지 화면 확인 시 저장 실패 가능임을 보고에 명시.
- 검증: 단위 테스트(payload 키 포함/제외), 타입 검사, 린트. 실제 저장·감사 기록은 운영 DB 적용 후 사용자 확인.
- 운영 DB 적용 후 `DATABASE.md`의 `timetable_status` 행에 관리자 변경 가능(052)을 반영한다.

## 후속 개선점

- 없음. 진단 단계의 옵션 A(전용 RPC)는 운영 DB 적용·타입 재생성 이후에만 가능하므로 채택하지 않는다.
