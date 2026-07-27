# [완료] 수집 출처·대표 이미지·공식 URL 분리

## 목적과 완료 조건

- Discord/JSON 수집 이미지를 축제 대표 썸네일로 자동 적용하지 않는다.
- 수집 게시물 URL을 축제 기본정보의 `source_url` 또는 `official_url`에 자동 적용하지 않는다.
- `official_url`은 관리자가 페스티벌 관리 화면에서 직접 입력한 값만 변경한다.
- 신규 승인 및 기존 축제 업데이트가 성공하면 임시 수집 이미지를 Storage에서 삭제한다.
- 수집 게시물 URL은 후보/수정 작업과 감사 로그에 유지한다.
- 페스티벌 관리 페이지를 열면 규칙에 맞는 대표 이미지 파일을 찾아 빈 `thumbnail_url`에 자동 연결한다.

## 확정 범위

- 신규 축제 승인 시 첫 수집 이미지를 `thumbnail_url`로 승격하는 코드 제거
- 기존 축제 JSON 업데이트에서 수집 이미지를 대표 이미지 변경 후보로 만드는 코드 제거
- 봇이 `draft.festival.source_url`에 Instagram 게시물 URL을 자동 입력하는 코드 제거
- 봇/JSON이 만든 `official_url`은 비우고 관리자 수동 입력만 허용
- 신규 승인 RPC가 `festivals.source_url`에 후보 URL을 복사하지 않도록 변경
- JSON 업데이트의 기본정보 비교·반영 대상에서 `source_url`, `official_url`을 제외
- 승인/업데이트 성공 후 `festival-candidate-posters` 임시 파일 전체 삭제
- 대표 이미지와 공식 URL의 기존 수동 업로드·수정 기능 유지
- `festival-thumbnails` 버킷 루트의 `{normalized_name}{시작일 YYYYMMDD}{종료일 YYYYMMDD}.webp` 파일 자동 인식
- 기존 `thumbnail_url`이 비어 있는 축제만 자동 연결하고 수동 대표 이미지는 덮어쓰지 않음
- 자동 연결 결과와 매칭 실패를 페스티벌 관리 화면에서 확인

## 제외 범위

- 새로운 영구 원본 이미지 테이블 추가
- 기존 DB의 `festivals.source_url` 일괄 정리
- 대표 이미지 자동 생성
- Supabase Storage Webhook·Edge Function을 이용한 업로드 즉시 반영
- SEO 메타데이터 및 구조화 데이터 구현

## 예상 수정 파일과 데이터

- `operations/discord-instagram-bot/src/bot.js`
- `app/admin/festival-candidates/page.tsx`
- `app/admin/festivals/import-json/StagedFestivalUpdate.tsx`
- 임시 이미지 정리 공통 함수 파일
- 대표 이미지 파일명 생성·동기화 공통 함수 파일
- `app/admin/festivals/page.tsx`
- 축제 초안 병합·비교 규칙 관련 파일 및 테스트
- 신규 Supabase migration
- 관련 테스트, `DATABASE.md`, `PROJECT_STATUS.md`

## 작업 순서

1. 수집 URL·공식 URL·대표 이미지의 자동 매핑 지점을 테스트로 고정한다.
2. 봇에서 수집 URL을 후보 정보에만 넣도록 수정한다.
3. 신규 승인과 기존 업데이트에서 자동 썸네일 승격 UI·로직을 제거한다.
4. DB 함수에서 후보 URL을 축제 기본정보에 복사하지 않도록 수정한다.
5. 성공한 작업의 임시 수집 이미지 전체를 삭제하는 공통 정리 로직을 적용한다.
6. 페스티벌 관리 진입 시 대표 이미지 파일을 조회하고 비어 있는 URL을 자동 연결한다.
7. URL이 후보/수정 작업과 감사 로그에 남는지 검증한다.
8. 린트·관련 테스트·전체 빌드를 실행하고 문서를 갱신한다.

## 위험과 검증 방법

- Storage 삭제가 승인 전에 실행되면 복구할 수 있으므로 DB 작업 성공 후에만 삭제한다.
- Storage 정리가 실패해도 승인 결과를 되돌리지 않고 오류 로그를 남긴다.
- 기존 대표 이미지와 관리자가 입력한 `official_url`이 JSON 업데이트로 덮이지 않는지 검사한다.
- `zandarifesta2024100320241005.webp`가 동일한 축제에만 연결되는지 검사한다.
- 파일이 없거나 중복 축제가 있거나 대표 이미지가 이미 있으면 자동으로 덮어쓰지 않는지 검사한다.
- 신규 승인과 기존 업데이트 각각에서 감사 로그 `source_url`이 유지되는지 SQL로 확인한다.
- 대표 이미지 수동 업로드·교체·삭제 기능이 그대로 동작하는지 확인한다.

## 후속 개선

- 필요해질 경우에만 수집 이미지를 영구 보관하는 별도 자료 테이블을 추가한다.
- 기존 `festivals.source_url` 데이터 정리와 칼럼 폐기는 별도 작업으로 판단한다.

## 완료 결과

- Discord와 업로드 JSON의 수집 URL은 후보·수정 작업·감사 로그에만 유지한다.
- 수집 이미지의 대표 썸네일 자동 승격을 제거했다.
- 신규 승인과 기존 수정 성공 후 임시 수집 이미지를 삭제한다.
- 공식 URL과 대표 이미지 URL은 수집 JSON의 자동 비교·반영 대상에서 제외했다.
- 페스티벌 관리 진입 시 규칙 파일명 WebP를 찾아 비어 있는 대표 이미지 URL만 자동 연결한다.
- Migration 046을 운영 DB에 적용했다.
