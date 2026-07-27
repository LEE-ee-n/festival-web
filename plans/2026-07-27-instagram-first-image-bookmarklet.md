# [완료] Instagram 상세 캐러셀 첫 이미지 저장 북마클릿

## 목적과 완료 조건

- Instagram 게시물 상세 팝업에서 캐러셀의 첫 번째 이미지 1장을 저장한다.
- 이미지를 브라우저에서 WebP로 변환해 자동 다운로드한다.
- 브라우저 보안 정책으로 이미지 변환이 차단되면 원본 이미지를 새 탭으로 연다.
- 게시물 상세 팝업이 아니거나 이미지를 찾지 못하면 원인을 안내하고 종료한다.

## 확정 범위

- Instagram 상세 팝업 안의 게시물 이미지만 대상으로 한다.
- 상세 팝업을 처음 열었을 때 보이는 캐러셀 첫 번째 이미지 URL을 찾는다.
- 가능한 가장 큰 `srcset` 이미지 URL을 사용한다.
- WebP 품질은 92%로 변환한다.
- 자동 다운로드 파일명에 게시물 식별자와 저장 날짜를 포함하고 `.webp` 확장자를 사용한다.
- 기존 티켓 사이트 북마클릿과 같은 설치 HTML 생성 방식을 사용한다.

## 제외 범위

- 캐러셀 전체 이미지 저장
- 동영상·릴스 프레임 저장
- Instagram 로그인 자동화
- Discord Instagram Bot 동작 변경
- 수집 이미지를 홈페이지나 DB에 자동 등록

## 예상 수정 파일과 데이터 흐름

- 추가: `crawler/bookmarklet/instagramFirstImageBookmarklet.ts`
- 추가: `crawler/bookmarklet/createInstagramFirstImageInstaller.ts`
- 추가: `tests/instagramFirstImageBookmarklet.test.ts`
- 수정: `package.json`
- 수정: `crawler/README.md`
- 수정: `ARCHITECTURE.md`
- 수정: `PROJECT_STATUS.md`

데이터 흐름:

1. 사용자가 Instagram 게시물 상세 팝업에서 북마클릿을 실행한다.
2. 북마클릿이 상세 팝업과 캐러셀 영역을 확인한다.
3. 캐러셀의 첫 번째 이미지에서 가장 큰 원본 후보 URL을 선택한다.
4. 이미지 Blob을 Canvas에서 WebP로 변환한다.
5. 변환한 `.webp` 파일을 자동 다운로드한다.
6. 이미지 접근 또는 변환이 실패하면 해당 원본 이미지 URL을 새 탭으로 연다.

## 작업 순서

1. 실제 화면 구조와 기존 Bot의 이미지 판별 규칙을 기준으로 DOM 탐색 조건을 정한다.
2. 첫 이미지 판별·WebP 변환·파일명·다운로드 fallback을 구현한다.
3. 설치 HTML 생성기와 npm 실행 명령을 추가한다.
4. 정상 화면, 잘못된 화면, 이미지 미발견, 다운로드 실패를 테스트한다.
5. 관련 문서와 작업 상태를 갱신한다.

## 회귀 위험과 검증 방법

- Instagram DOM 변경: 동적 클래스명 대신 `role`, `article`, `img`, `srcset`과 위치 관계를 사용한다.
- 현재 슬라이드 오인: 캐러셀 이동 상태와 무관하게 첫 번째 슬라이드 후보를 선택하는 테스트를 둔다.
- CDN 다운로드 차단: WebP 변환 실패 시 새 탭 fallback과 안내 문구를 검증한다.
- 다른 이미지 오인: 프로필 사진·댓글 작성자 사진처럼 작은 이미지를 제외한다.
- 검증: 관련 단위 테스트, 타입 검사, 린트, 설치 HTML 생성, 실제 Instagram 상세 팝업 실행 확인.

## 후속 개선점

- 필요할 때만 캐러셀 전체 저장과 동영상 포스터 저장을 별도 계획으로 진행한다.

## 진행 상태

- [x] 계획 승인
- [x] 북마클릿 구현
- [x] 설치 파일 생성기 연결
- [x] 테스트 및 문서 갱신
- [x] 실제 Instagram 화면 확인

## 실제 결과

- 상세 팝업에서 가장 크게 보이는 게시물 사진의 최대 `srcset` URL을 선택한다.
- Canvas에서 품질 92% WebP로 변환해 `.webp` 파일로 자동 다운로드한다.
- 변환이 차단되면 원본 이미지를 새 탭으로 열고 안내한다.
- 관련 테스트 4개, 전체 테스트 146개, 타입 검사와 변경 파일 ESLint가 통과했다.
- 설치 파일을 `crawler-output/instagram-first-image-bookmarklet-installer.html`에 생성했다.
- 사용자가 실제 Instagram 상세 팝업에서 WebP 자동 저장 성공을 확인했다.
