# Instagram 첫 사진 북마클릿 상세 화면 오판 수정

## 목적과 완료 조건

- `/p/...` 또는 `/reel/...` 직접 주소에서 Instagram DOM 구조가 달라져도 첫 사진을 저장한다.
- 실제 상세 주소에서 상세 화면을 다시 열라는 잘못된 오류를 표시하지 않는다.

## 범위

- `crawler/bookmarklet/instagramFirstImageBookmarklet.ts`
- `tests/instagramFirstImageBookmarklet.test.ts`
- 관련 크롤러 문서

## 작업 순서

1. 게시물 영역 탐색에 `[role="main"]`과 전체 문서 대체 경로를 추가한다.
2. 화면 이미지가 없으면 `og:image`를 대체 이미지로 사용한다.
3. Instagram의 지연 렌더링을 짧게 기다린 뒤 다시 탐색한다.
4. 직접 상세 주소 회귀 테스트를 추가하고 설치 파일을 다시 생성한다.

## 검증

- Instagram 북마클릿 단위 테스트
- 생성된 설치 파일 확인

## 완료

- [완료] `[role="main"]`, 전체 문서와 `og:image` 대체 경로를 추가했다.
- [완료] 잘못 선택된 `<main>`에 갇히지 않도록 전체 문서의 이미지와 CSS 배경 이미지를 검색한다.
- [완료] 최대 1.5초 동안 지연 렌더링을 다시 확인하도록 했다.
- [완료] 관련 테스트 7개가 모두 통과했다.
- [완료] Instagram 북마클릿 설치 파일을 다시 생성했다.
