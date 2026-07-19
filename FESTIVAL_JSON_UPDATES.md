# 정식 축제 JSON 안전 업데이트

## 목적

신규 등록 작업함에서 승인된 정식 축제에 이후 발표된 라인업·티켓·기본정보를 JSON으로 누적한다.

## 축제 매칭 기준

다음 세 값이 모두 같은 승인 축제만 업데이트 대상으로 선택한다.

- `festivals.normalized_name`
- `festivals.start_date`
- `festivals.end_date`

일치하는 축제가 없으면 새 축제를 만들지 않고 신규 등록 작업함을 이용하도록 안내한다.

## 반영 규칙

- 기존 값과 같은 항목: 반영하지 않음
- 기존 값이 비어 있고 JSON에만 있는 항목: 기본 선택
- 기존 값과 JSON 값이 다른 항목: 검토 필요, 관리자가 선택한 경우에만 변경
- 신규 라인업: 기존 라인업을 삭제하지 않고 추가
- 같은 아티스트의 다른 공연 날짜: 별도 공연으로 추가
- 신규 티켓: 기존 티켓을 삭제하지 않고 추가
- 같은 티켓의 가격·오픈 시각 등이 다른 경우: 관리자가 선택한 경우에만 수정
- JSON에 없는 기존 데이터: 항상 유지

## 트랜잭션과 로그

`public.apply_festival_json_update` 함수가 선택한 변경을 한 트랜잭션에서 처리한다. 하나라도 실패하면 전체 변경을 취소한다.

성공한 업데이트는 `public.festival_update_logs`에 다음 정보와 함께 저장한다.

- 축제 ID
- 업데이트한 관리자 ID
- 업데이트 시각
- JSON 출처 유형과 URL
- 원본 파일명
- 선택하여 반영한 항목의 변경 전·후 값

## 관련 파일

- 화면: `app/admin/festivals/import-json/page.tsx`
- 비교 로직: `lib/festivals/festivalUpdatePreview.ts`
- DB 마이그레이션: `supabase/migrations/020_safe_festival_json_updates.sql`
- 비교 테스트: `tests/festivalUpdatePreview.test.ts`

## 적용 순서

1. Supabase SQL Editor에서 `020_safe_festival_json_updates.sql` 실행
2. 애플리케이션 코드 배포
3. 관리자 페이지의 `페스티벌 관리 → 정식 축제 JSON 업데이트`에서 테스트

