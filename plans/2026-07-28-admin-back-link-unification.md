# [완료] 관리자 돌아가기 링크 통일

## 목적과 완료 조건

- 관리자 메인에서 연결되는 5개 페이지의 `관리자 페이지로 돌아가기` 링크를 같은 모양으로 통일한다.
- `/admin/festivals`의 화살표·글자·색상·여백·호버를 기준으로 사용한다.

## 확정 범위

- 신규 페스티벌 등록
- 기존 페스티벌 수정
- 페스티벌 관리
- 아티스트 관리
- 전체 변경 기록
- 공통 `AdminBackLink` 컴포넌트를 만들고 위 5곳에서 재사용한다.

## 제외 범위

- 관리자 내부의 다른 목록·상세 이동 링크
- 관리자 페이지의 나머지 디자인과 기능

## 예상 수정 파일

- `components/admin/AdminBackLink.tsx`
- `app/admin/festival-candidates/page.tsx`
- `app/admin/festival-updates/page.tsx`
- `app/admin/festivals/page.tsx`
- `app/admin/artists/page.tsx`
- `app/admin/audit-logs/page.tsx`
- `PROJECT_STATUS.md`

## 작업 순서

1. `/admin/festivals` 링크 모양을 공통 컴포넌트로 만든다.
2. 5개 페이지의 개별 링크를 공통 컴포넌트로 교체한다.
3. 타입 검사와 변경 파일 ESLint를 실행한다.
4. localhost에서 5개 페이지의 위치와 모양을 확인한다.

## 회귀 위험과 검증

- 기존 페이지별 위쪽 여백이 달라질 수 있어 `mb-6`을 공통으로 유지한다.
- 링크 목적지는 모두 `/admin`으로 유지한다.
- localhost 접근이 차단되면 실제 화면 확인은 사용자 확인 대기로 남긴다.

## 후속 개선점

- 다른 관리자 하위 페이지에도 같은 링크가 필요해지면 공통 컴포넌트를 추가 적용한다.

## 실제 결과

- `/admin`에서 연결되는 5개 관리 페이지의 돌아가기 링크를 `AdminBackLink` 공통 컴포넌트로 교체했다.
- 화살표, 글자 크기·굵기·색상, 위아래 여백과 호버를 `/admin/festivals` 기준으로 통일했다.
- 타입 검사와 변경 파일 ESLint가 통과했다.
- localhost 실제 화면 확인은 남아 있다.
