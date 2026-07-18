# Festival Web 구조

이 문서는 파일을 찾을 때 필요한 대략적인 역할을 기록한다. 세부 구현은 각 파일의 코드를 기준으로 확인한다.

## 공개 화면

- `app/page.tsx`: 메인 달력 화면 진입점
- `components/Calendar.tsx`: 선택한 월의 축제를 조회하고 달력 이동과 선택 상태 관리
- `components/calendar/`: 달력 헤더, 날짜 셀, 월간 고정 축제 막대, 상세 패널 UI
- `components/FestivalList.tsx`, `components/FestivalCard.tsx`: 선택한 날짜의 축제 목록과 카드
- `components/FestivalDetailDrawer.tsx`: 달력에서 선택한 축제 상세를 우측 패널로 표시
- `app/festival/[id]/page.tsx`: 독립된 축제 상세 페이지
- `app/artist/[id]/page.tsx`: 아티스트 상세 페이지
- `components/festival/`: 축제 기본정보, 출연진 시간표, 티켓 안내 공통 UI

## 관리자 화면

- `app/admin/layout.tsx`: `/admin` 전체에 관리자 인증 적용
- `app/admin/login/page.tsx`: Supabase 로그인과 관리자 권한 확인
- `app/admin/page.tsx`: 관리자 기능 메뉴
- `app/admin/festivals/page.tsx`: 축제 목록 조회와 삭제
- `app/admin/festivals/new/page.tsx`: 신규 축제 기본정보 등록
- `app/admin/festival-candidates/page.tsx`: 수집 후보 JSON 수정·저장, 승인 등록, 삭제
- `app/admin/festival-candidates/components/FestivalCandidateJsonUploader.tsx`: 헤르메스 JSON 검사와 검토 대기 후보 저장
- `app/admin/festival-candidates/components/Candidate*Tab.tsx`: 후보 기본정보·라인업·티켓 폼과 `normalized_name` 기준 기존 아티스트 매칭
- `app/admin/festival-candidates/hooks/useFestivalCandidateDraft.ts`: 승인 전 세 탭의 JSON 초안 상태 관리
- `app/admin/festival-candidates/hooks/useFestivalCandidates.ts`: 후보 조회, 초안 저장, 승인과 정식 등록
- `app/admin/festivals/[id]/lineup/page.tsx`: 최초 데이터 로딩, 탭 전환, 관리 화면 조립
- `app/admin/festivals/[id]/lineup/components/`: 기본정보, 출연진, 티켓 탭 UI
- `app/admin/festivals/[id]/lineup/hooks/useFestivalBasicInfo.ts`: 기본정보와 썸네일 상태·저장
- `app/admin/festivals/[id]/lineup/hooks/useFestivalArtists.ts`: 아티스트 검색과 라인업 추가·수정·삭제
- `app/admin/festivals/[id]/lineup/hooks/useFestivalTickets.ts`: 티켓 추가·수정·삭제
- `app/admin/festivals/import-json/page.tsx`: JSON의 축제·출연진·티켓을 트랜잭션 함수로 한 번에 저장
- `app/admin/festivals/import/page.tsx`: CSV 출연진을 기존 축제에 등록
- `app/admin/import/page.tsx`: XLSX의 축제와 출연진 통합 등록
- `app/admin/artists/page.tsx`: 아티스트 검색, 생성, 별칭과 대표 이름 관리
- `app/admin/artists/import-update/page.tsx`: XLSX로 아티스트 정보를 비교하고 일괄 수정

## 공통 로직

- `lib/types.ts`: 축제, 출연진, 티켓 등 공통 TypeScript 타입
- `lib/calendar.ts`: 날짜 변환과 날짜별 축제 분류
- `lib/calendarFestivalBar.ts`: 여러 날짜에 걸친 축제 막대 길이와 종료 모양 계산
- `lib/calendarFestivalLanes.ts`: 월간 축제 겹침을 계산해 축제별 고정 줄 배정
- `lib/auth/getCurrentAdminAccess.ts`: 로그인 사용자 관리자 여부 확인
- `lib/artists/`: 아티스트 이름 정규화, 검색과 normalized_name 기준 후보 중복 매칭
- `lib/festivals/`: 축제 기본정보, 출연진, 티켓, 썸네일의 조회·추가·수정·삭제
- `lib/festivals/ticketDisplay.ts`: 최신 티켓 회차와 표시할 판매처 버튼 결정
- `lib/festivals/thumbnailValidation.ts`: 썸네일 형식, 실제 파일 내용, 5MB 제한 검사
- `lib/festivals/festivalDraft.ts`: 헤르메스 JSON 필수값과 편집 표시 순서 검사
- `lib/hooks/useFestivalDetail.ts`: 전체 상세페이지와 우측 패널의 축제·출연진·티켓 공통 조회 및 출연진 정렬
- `lib/hooks/useCurrentTimeAt.ts`: 티켓 오픈 시간에 맞춰 화면 시간을 갱신
- `lib/supabase/client.ts`: 브라우저용 Supabase 클라이언트

## Supabase

- `supabase/migrations/005~008`: 관리자 인증·RLS, 트랜잭션 JSON 등록, 티켓·썸네일 제한
- `supabase/migrations/009~012`: 수집 후보 저장·승인 등록, 빈 출연진·티켓 허용, 아티스트 정규화 이름 제약
- `supabase/DATABASE_SCHEMA.md`: 테이블 관계와 운영 규칙
- `SECURITY.md`: 관리자 인증과 공개·관리자 권한 정책
- `DATABASE.md`: 운영 DB 칼럼 기록

## 자동 테스트

- `tests/calendarFestivalBar.test.ts`: 캘린더 축제 막대 규칙
- `tests/calendarFestivalLanes.test.ts`: 겹치는 축제의 월간 고정 줄 배정 규칙
- `tests/calendarSelection.test.ts`: 이전·다음 달 날짜 선택과 월 이동 규칙
- `tests/artistMatching.test.ts`: 후보 아티스트의 기존 아티스트 중복 매칭 규칙
- `tests/artistNameNormalization.test.ts`: `normalized_name` 변환과 허용 형식
- `tests/festivalDraft.test.ts`: 헤르메스 JSON 필수값, 신뢰도와 표시 순서 검사
- `tests/ticketDisplay.test.ts`: 최신 티켓, 오픈 시간, 판매처 버튼 규칙
- `tests/thumbnailValidation.test.ts`: 이미지 형식과 용량 제한

`test-data/`에는 JSON 등록 성공·실패와 헤르메스 후보 예제 파일을 둔다.

테스트는 `npm test`로 실행한다.

## 수집 후보 흐름

- `HERMES_IMPORT.md`: 헤르메스 사진 추출 지시문과 JSON 규격
- 헤르메스 JSON 업로드 → 검토 대기 저장 → 관리자 수정·저장 → 승인 시 정식 축제·출연진·티켓 등록
- 라인업은 후보를 열 때와 `normalized_name` 수정 후 자동으로 기존 아티스트를 확인하고, 필요하면 이름 검색으로 직접 연결한 뒤 승인한다.
- 승인 등록은 DB 트랜잭션으로 처리하며 실패하면 후보와 정식 데이터 변경을 모두 취소한다.

## 로컬 전체 검사

- `npm run check`: 테스트, 린트, 타입 검사, 프로덕션 빌드를 순서대로 실행
- `npm run dev`: 실제 화면과 Supabase 연결 기능을 localhost에서 확인
