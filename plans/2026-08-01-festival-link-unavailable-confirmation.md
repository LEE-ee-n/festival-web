# [구현 완료·운영 DB 적용 대기] 공식 링크 없음 확인 상태

## 목적과 완료 조건

- 공식 Instagram 또는 홈페이지가 실제로 없는 축제를 미확인 누락과 구분한다.
- URL이 비어 있고 `없음 확인`도 하지 않은 경우에만 관리자 데이터 점검판에 표시한다.
- 실제 URL이 있으면 기존 공개 버튼을 표시하고 `없음 확인` 상태는 자동 해제한다.
- 관리자 변경은 기존 축제 기본정보 감사 로그에 함께 기록한다.

## 확정 범위

- `public.festivals`에 `instagram_url_unavailable`, `official_url_unavailable` boolean 칼럼 추가
- 두 칼럼은 `NOT NULL DEFAULT false`
- 페스티벌 관리 기본정보의 각 URL 입력 아래에 `공식 계정/홈페이지 없음 확인 완료` 체크박스 추가
- 체크하면 해당 URL 입력값을 비우고, URL을 입력하면 해당 체크를 자동 해제
- 기존 `update_festival_basic_info_with_audit` RPC에서 두 값을 저장하고 기존 감사 전후 스냅샷에 포함
- 어떤 등록·수정 경로든 URL이 들어오면 해당 `unavailable` 값을 `false`로 만드는 DB 트리거 추가
- 데이터 점검판은 `URL 비어 있음 + unavailable=false`만 누락으로 집계
- 공개 화면은 기존처럼 실제 URL 존재 여부만 사용
- 운영 DB 타입과 관련 문서 갱신

## 제외 범위

- URL이 실제로 존재하는지 네트워크로 자동 검사
- 공식 링크를 자동 탐색하거나 자동 삭제
- 장소·주소·가격·썸네일의 별도 `없음 확인` 상태
- 별도 예외 테이블
- 신규 후보 등록 화면의 체크박스

## 예상 수정 파일과 데이터 흐름

- `supabase/migrations/051_festival_link_unavailable_confirmation.sql`: 칼럼, URL 입력 시 자동 해제 트리거, 기본정보 감사 RPC 확장
- `lib/supabase/database.types.ts`: 새 칼럼 타입 반영
- `lib/festivals/updateFestivalBasicInfo.ts`, `festivalBasicInfoPayload.ts`: 입력·저장 payload 확장
- `app/admin/festivals/[id]/lineup/hooks/useFestivalBasicInfo.ts`: 조회값 초기화와 체크 상태 저장
- `app/admin/festivals/[id]/lineup/components/BasicInfoTab.tsx`: URL별 확인 체크박스와 상호 배타 동작
- `lib/festivals/festivalDataQuality.ts`, `components/admin/AdminFestivalDataQuality.tsx`: 확인 완료 상태를 조회·집계에서 제외
- 관련 테스트, `DATABASE.md`, `ARCHITECTURE.md`, `PROJECT_STATUS.md`

데이터 흐름은 관리자가 URL 또는 `없음 확인` 선택 → 기본정보 저장 payload → 감사 RPC에서 축제 행 갱신 → 감사 전후 스냅샷 기록 → 점검판 재조회 순서다. 다른 경로에서 URL이 저장되면 DB 트리거가 `없음 확인`을 자동 해제한다.

## 작업 순서

- [x] Migration 051 작성 및 UTF-8 SQL 검토
- [x] 운영 DB 적용 전 코드 타입·입력 payload 확장
- [x] 관리자 기본정보 체크박스와 상호 배타 동작 구현
- [x] 데이터 점검판 판정·조회 확장
- [x] 누락·확인 완료·URL 입력 자동 해제 테스트 작성
- [x] 관련 문서 갱신
- [x] 관련 테스트, 전체 테스트, 타입 검사, 린트 실행
- [ ] 사용자 운영 DB SQL 실행 및 칼럼·RPC·트리거 확인
- [ ] localhost 관리 저장·점검판·공개 버튼 실제 확인

## 회귀 위험과 검증 방법

- 기존 URL이 있는 행은 migration 후에도 `unavailable=false`인지 확인한다.
- 체크 상태와 URL이 동시에 남지 않도록 UI와 DB 트리거 양쪽에서 보장한다.
- 과거 호출자가 새 JSON 키를 보내지 않아도 기존 체크 상태가 임의로 지워지지 않게 RPC에서 키 존재 여부를 확인한다.
- 체크 변경만 저장해도 감사 이벤트 전후 데이터에 기록되는지 확인한다.
- URL을 다시 입력했을 때 점검판 제외와 공개 버튼 표시가 정상인지 확인한다.
- 신규 칼럼 적용 전 코드를 배포하지 않도록 DB 적용과 배포 순서를 명시한다.

## 후속 개선점

- 실제 운영에서 필요하면 썸네일·장소·가격도 같은 방식이 아니라 항목별 의미에 맞는 상태 모델을 별도 설계한다.
- 공식 링크 자동 유효성 검사는 요청 제한과 오탐 기준을 정한 뒤 별도 계획으로 검토한다.

## 구현 결과

- `festivals`에 두 확인 칼럼을 추가하고 URL 저장 시 자동 해제하는 Migration 051을 작성했다.
- 기존 페스티벌 기본정보에 URL별 `없음 확인 완료` 체크박스를 추가하고 기존 감사 저장 RPC에 연결했다.
- 점검판은 빈 URL이어도 없음 확인이 완료된 축제를 누락 집계에서 제외한다.
- 관련 점검·payload 테스트 7개와 전체 테스트 182개, 타입 검사와 변경 파일 ESLint가 통과했다.
- 운영 DB 적용과 실제 관리 저장·점검판·공개 버튼 확인은 남아 있다.
