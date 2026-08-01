# [완료] 관리자 썸네일 WebP 자동 변환·규칙 파일명 업로드

## 목적과 완료 조건

- 관리자가 JPG·PNG·WebP 원본을 선택하면 별도 변환 없이 대표 이미지를 등록할 수 있다.
- 브라우저에서 긴 변 최대 1600px, WebP 품질 85로 변환한 파일만 Supabase `festival-thumbnails`에 저장한다.
- 업로드 파일명은 기존 공통 규칙인 `{normalized_name}{시작일 YYYYMMDD}{종료일 YYYYMMDD}.webp`를 사용한다.
- 변환된 공개 URL을 `festivals.thumbnail_url`에 기존 감사 로그 흐름으로 반영한다.

## 확정 범위

- 기존 페스티벌 관리 기본정보의 썸네일 업로드
- JPG·PNG·WebP 입력 검증 후 WebP 자동 변환
- 축제 `normalized_name`, `start_date`, `end_date` 기반 파일명 자동 생성
- 같은 축제 규칙 파일은 교체 업로드하고 브라우저 캐시 갱신 처리
- 이전 썸네일이 다른 Storage 경로면 최종 반영 성공 후 정리
- 업로드 안내 문구를 자동 변환 규칙에 맞게 변경

## 제외 범위

- 사용자의 컴퓨터에 있는 원본 파일 수정·삭제
- 신규 축제 생성 전에 썸네일 동시 업로드
- 수집 후보 포스터의 자동 대표 이미지 승격
- 기존 Storage 이미지 일괄 이름 변경
- Supabase DB·RLS·버킷 정책 변경

## 예상 수정 파일·데이터 흐름

- `lib/festivals/uploadFestivalThumbnail.ts`
- WebP 변환 공통 함수
- `lib/festivals/festivalThumbnailSync.ts`
- `app/admin/festivals/[id]/lineup/hooks/useFestivalBasicInfo.ts`
- `app/admin/festivals/[id]/lineup/components/BasicInfoTab.tsx`
- 관련 테스트, `PROJECT_STATUS.md`

원본 선택 → 파일 검증 → 브라우저 WebP 변환·축소 → 규칙 파일명 생성 → `festival-thumbnails` 업로드 → 감사 RPC로 `thumbnail_url` 반영 → 이전 다른 경로 정리 순서로 처리한다.

## 작업 순서

1. WebP 변환 크기 계산과 규칙 파일명 테스트를 추가한다.
2. 브라우저 변환 공통 함수를 구현한다.
3. 기존 업로드 함수가 축제 식별값으로 규칙 파일명을 만들고 WebP만 업로드하도록 변경한다.
4. 동일 규칙 파일 교체와 URL 캐시 갱신, 이전 경로 정리를 안전하게 처리한다.
5. 관리 화면 안내 문구를 변경한다.
6. 관련 테스트, 타입 검사와 변경 파일 ESLint를 실행한다.
7. localhost에서 JPG·PNG 업로드와 실제 Storage 파일명을 확인한다.

## 회귀 위험과 검증 방법

- `normalized_name` 또는 날짜가 유효하지 않으면 업로드 전에 중단한다.
- 원본 비율을 유지하고 확대하지 않으며 긴 변만 최대 1600px로 제한한다.
- 변환 실패 시 Storage와 DB를 변경하지 않는다.
- 업로드 성공 후 감사 RPC가 실패하면 새 객체를 정리하되 기존 대표 이미지는 유지한다.
- 새 파일과 이전 파일 경로가 같으면 업로드 직후 삭제하지 않는다.
- 동일 파일명 교체 시 캐시 때문에 과거 이미지가 보이지 않도록 URL을 갱신한다.
- 기존 JPG·PNG 입력 검증과 WebP 서명 검사를 유지한다.

## 후속 개선점

- 신규 축제 생성과 썸네일 업로드를 한 번에 처리할 필요가 생기면 생성 성공 후 업로드하는 별도 흐름을 추가한다.

## 구현 결과

- 관리자에서 선택한 JPG·PNG·WebP를 브라우저에서 비율 유지, 긴 변 최대 1600px, 품질 85의 WebP로 변환한다.
- 기존 `getFestivalThumbnailFileName`을 재사용해 `{normalized_name}{시작일 YYYYMMDD}{종료일 YYYYMMDD}.webp` 파일명을 자동 생성한다.
- 변환된 WebP를 `festival-thumbnails` 버킷 루트의 규칙 파일명으로 업로드하고 캐시 갱신용 URL을 감사 RPC에 반영한다.
- 동일 규칙 파일 교체 전 기존 객체를 백업하고, 감사 RPC 실패 시 기존 객체를 복원하도록 처리했다.
- 기존 대표 이미지가 다른 Storage 경로에 있으면 새 URL 반영 성공 후 기존 객체를 정리한다.
- 관리 화면에 최대 1600px WebP 자동 변환·파일명 자동 생성 안내를 추가했다.
- 변환 크기·품질 테스트 4개를 추가했으며 전체 테스트 160개, 타입 검사와 관련 파일 ESLint가 통과했다.
- 실제 관리자 화면에서 업로드한 이미지가 `pajufolk2026090420260905.webp?v=...` URL로 저장되는 것을 확인했다.
- `normalized_name=pajufolk`, 시작일 `2026-09-04`, 종료일 `2026-09-05`가 파일명 규칙에 정확히 반영됐고 캐시 갱신 값도 정상 적용됐다.
