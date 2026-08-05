# [추가 수정 구현 완료·화면 확인 대기] 아티스트 추천 플리 자동 변환·로고 업로드

## 목적과 완료 조건

- YouTube의 `watch?v=...&list=...` 주소를 입력해도 저장 시 재생목록 대표 주소로 자동 변환한다.
- 관리자 아티스트 편집 패널에서 JPG·PNG·WebP 로고를 선택하고 기존 저장 버튼으로 함께 반영한다.
- 원본 파일명과 관계없이 `{normalized_name}.webp`로 변환해 전용 Storage에 저장하고 `artists.image_url`에 연결한다.

## 확정 범위

- 추천 플레이리스트 입력 지원
  - `/playlist?list=...`는 그대로 정규화
  - `/watch?...&list=...`는 `https://www.youtube.com/playlist?list=...`로 변환
  - `list`가 없는 일반 영상 주소는 거부
- 로고 업로드
  - JPG·PNG·WebP, 최대 5MB
  - 비율 유지, 확대하지 않음, 긴 변 최대 800px, WebP 품질 90
  - 파일명은 편집 중인 새 `normalized_name` 기준 `{normalized_name}.webp`
  - `artist-images` 공개 버킷 사용
  - 파일 선택 즉시 로컬 미리보기, 실제 업로드는 기존 `저장` 버튼 클릭 시 실행
- Storage 업로드와 아티스트 수정 RPC 실패 시 새 파일 복원·정리
- 기존 Storage 로고가 다른 경로면 성공 후 정리하고, 프로젝트의 `/artists/...` 정적 파일은 삭제하지 않음
  - 이미지 URL 변경도 기존 아티스트 감사 기록에 포함
- 전체 아티스트 목록의 프로필 상태 배지는 줄폭에 따라 임의로 감싸지 않고 `로고·YT / IG·플리` 2×2로 고정

## 제외 범위

- 로고 삭제 버튼
- 여러 아티스트 일괄 업로드
- SVG·GIF 입력
- 이미지 자르기·배경 제거·정사각형 강제
- Instagram API 연동

## 예상 수정 파일·데이터 흐름

- `lib/artists/profileLinks.ts`: watch 주소의 재생목록 대표 주소 변환
- 공통 이미지 검증·변환 로직: 기존 축제 WebP 변환을 옵션형 공통 함수로 확장
- `lib/artists/uploadArtistImage.ts`: 파일명 생성, Storage 백업·업로드·복구·이전 파일 정리
- 아티스트 관리자 페이지와 프로필 편집 컴포넌트: 파일 상태·미리보기·저장 흐름 연결
- `supabase/migrations/054_artist_image_upload.sql`: `artist-images` 버킷·관리자 정책과 `image_url` 감사 저장 RPC 확장
- 관련 테스트, `DATABASE.md`, `ARTIST_MANAGEMENT.md`, `PROJECT_STATUS.md`

데이터 흐름은 `파일 선택 → 로컬 미리보기 → 저장 클릭 → WebP 변환 → Storage 업로드 → 기본정보·링크·image_url 감사 RPC 반영 → 성공 후 이전 Storage 객체 정리` 순서다.

## 작업 순서

1. [x] 추천 플리 URL 변환 테스트와 로직을 추가한다.
2. [x] 기존 축제 변환 동작을 유지하면서 옵션형 공통 WebP 변환기를 만든다.
3. [x] 아티스트 로고 파일명과 안전한 Storage 업로드·복구 함수를 구현한다.
4. [x] 관리자 행 내부 편집 패널에 파일 선택·미리보기를 연결한다.
5. [x] `image_url` 저장과 Storage 정책 migration을 작성한다.
6. [x] 문서와 DB 타입을 갱신하고 테스트·타입 검사·린트를 실행한다.
7. [ ] migration 적용 후 실제 잔나비 로고 교체와 공개 페이지 표시를 확인한다.

## 회귀 위험과 검증

- `normalized_name` 변경과 파일명이 일치하는지 확인한다.
- 변환 또는 RPC 실패 시 기존 이미지 URL과 기존 Storage 객체가 유지되는지 확인한다.
- 같은 파일명 교체 시 캐시 갱신 쿼리가 붙는지 확인한다.
- PNG 투명 배경이 WebP 변환 후 유지되는지 실제 이미지로 확인한다.
- 기존 축제 썸네일 변환 테스트가 계속 통과하는지 확인한다.
- DB migration은 UTF-8 확인 후 운영 DB 적용 결과를 별도로 검증한다.

## 후속 개선점

- 여러 파일 일괄 업로드와 자동 아티스트 매칭
- 프로필 누락 아티스트 필터

## 코드 리뷰 후 추가 확정 범위

- `normalized_name` 변경 시 기존 `artist-images` 로고도 새 `{normalized_name}.webp` 경로로 안전하게 복사한 뒤 DB 반영 성공 후 이전 파일 삭제
- 아티스트 삭제 성공 후 연결된 `artist-images` Storage 로고 삭제
- 선택한 새 로고를 저장 전에 취소하는 버튼 추가
- `youtu.be/{video}?list=...` 공유 주소도 재생목록 대표 주소로 자동 변환
- 경로 변경·삭제 실패는 DB 저장 성공 여부와 구분해 관리자에게 경고
- 기존 프로젝트 정적 파일 `/artists/...`는 Storage 관리 대상이 아니므로 자동 삭제·이동하지 않음

## 실제 결과

- 영상 포함 재생목록 주소는 `list` 값을 추출해 YouTube 재생목록 대표 주소로 저장한다.
- 프로필 상태는 요청대로 2×2로 고정했다.
- 로고 파일 선택과 미리보기를 행 내부 편집 패널에 추가하고 기존 저장 버튼에 연결했다.
- 공통 WebP 변환기를 추가하면서 기존 축제 썸네일의 1600px·품질 85 동작은 유지했다.
- 아티스트 로고는 최대 800px·품질 90·`{normalized_name}.webp` 규칙으로 준비한다.
- Migration 054에 `artist-images` 공개 버킷, 관리자 Storage 정책과 `image_url` 감사 저장을 추가했다.
- `normalized_name` 변경 시 Storage 로고를 새 이름으로 복사하고 DB 저장 성공 후 이전 파일을 정리한다.
- 아티스트 삭제 성공 후 Storage 로고를 정리하며, 정적 `/artists/...` 이미지는 대상에서 제외한다.
- 선택한 로고 취소 버튼과 `youtu.be/...?...list=...` 주소 변환을 추가했다.
- 전체 테스트 212개, 타입 검사, 변경 파일 ESLint가 통과했다.
- localhost 실제 저장·이름 변경·삭제 화면 검증은 남아 있다.
