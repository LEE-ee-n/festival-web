# [헤더 아이콘 삭제 완료·화면 확인 대기] 로고·파비콘 교체

## 목적과 완료 조건

- 제공받은 투명 PNG 로고를 홈페이지 공통 헤더에 적용한다.
- 제공받은 정사각형 PNG 아이콘을 사이트 파비콘으로 등록한다.
- 헤더의 기존 분홍색 음표 이미지는 제거하고, 외부 Supabase 글자 로고는 새 로컬 로고로 교체한다.

## 확정 범위

- `festibom_logo.png` 1200×240 투명 PNG를 프로젝트 로컬 브랜드 자산으로 복사
- `festibom-icon.png` 512×512 투명 PNG를 Next.js `app/icon.png`로 등록
- 공통 헤더에는 글자 로고 `festibom-logo.png`만 표시
- 공통 헤더의 외부 Supabase 로고 URL을 새 로컬 로고 경로로 교체
- 브라우저 파비콘도 같은 `festibom-icon.png` 사용
- 기존 홈 링크, 헤더 높이, 로그인·관리자 기능 유지

## 추가 확정 범위 (2026-08-01)

- 공통 헤더에서 글자 로고 왼쪽의 검은 아이콘을 통째로 삭제한다.
- 글자 로고 `festibom-logo.png`와 브라우저 파비콘 `app/icon.png`는 유지한다.
- 아이콘 이미지 자체는 편집하지 않는다.

## 제외 범위

- 제공 이미지의 디자인·색상·비율 수정
- Supabase `site-assets` 기존 파일 삭제
- 별도 로고 제작
- PWA manifest 추가

## 예상 수정 파일·자산

- `public/images/brand/festibom-logo.png`
- `app/icon.png`
- `components/CommonHeader.tsx`
- `PROJECT_STATUS.md`

## 작업 순서

1. 제공 이미지의 크기·투명 배경을 확인한다.
2. 로고와 파비콘을 프로젝트의 정해진 위치에 복사한다.
3. 헤더에는 새 로컬 글자 로고만 표시하고, 왼쪽 아이콘은 제거한다.
4. 타입 검사, 관련 파일 ESLint와 이미지 파일 검사를 실행한다.
5. localhost에서 헤더와 브라우저 탭 아이콘을 확인한다.

## 회귀 위험과 검증 방법

- 로고의 고유 비율을 유지하고 헤더에서 찌그러지지 않게 표시한다.
- 모바일에서 로고가 로그인·관리자 버튼 영역을 침범하지 않는지 확인한다.
- `app/icon.png`가 512×512 PNG이며 투명 모서리를 유지하는지 다시 검사한다.
- 외부 로고 URL 제거 후 네트워크 상태와 관계없이 글자 로고가 표시되는지 확인한다.

## 후속 개선점

- 모바일 홈 화면 전용 아이콘이 필요하면 별도 `app/apple-icon.png`를 추가한다.

## 구현 결과

- 제공받은 `festibom-icon.png`를 `public/images/brand/festibom-icon.png`와 Next.js 파비콘 규칙 파일 `app/icon.png`에 적용했다.
- 제공받은 `festibom_logo.png`를 `public/images/brand/festibom-logo.png`에 적용했다.
- 공통 헤더의 왼쪽 아이콘을 삭제하고, 외부 Supabase 글자 로고는 새 로컬 글자 로고로 교체했다.
- 헤더의 홈 링크, 높이와 로그인·관리자 기능은 유지했다.
- 아이콘 512×512, 로고 1200×240, 두 파일 모두 32비트 투명 PNG임을 확인했다.
- 헤더 아이콘과 `app/icon.png`의 SHA-256 일치를 확인했다.
- 전체 테스트 160개, 타입 검사와 `CommonHeader.tsx` ESLint가 통과했다.
- 요청을 잘못 이해해 생성했던 손잡이 제거 편집 이미지는 프로젝트에 적용하지 않았다.
- localhost 헤더 표시와 브라우저 탭 파비콘 실제 확인은 남아 있다.
