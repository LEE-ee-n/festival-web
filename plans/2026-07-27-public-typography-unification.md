# [완료] 공개 화면 타이포그래피 통합

## 목적과 완료 조건

- 공개 화면의 글자 크기·굵기·줄간격을 `lib/typography.ts` 한곳에서 관리한다.
- 같은 역할의 글자는 같은 스타일을 사용한다.
- `body`와 긴 글용 `bodyReading`을 분리한다.
- 기존 화면 모양을 임의로 바꾸지 않는다.

## 확정 범위

- `lib/typography.ts`에 공개 화면용 타이포그래피 역할을 정의한다.
- 독립된 축제 상세 페이지와 아티스트 상세 페이지는 같은 페이지 제목·섹션 제목·본문 체계를 사용한다.
- 달력 옆 축제 상세 패널은 좁은 패널 전용 타이포그래피로 분리해서 유지한다.
- 우선 다음 역할을 구분한다.
  - `pageTitle`: 페이지 제목
  - `sectionTitle`: 섹션 제목
  - `cardTitle`: 카드 제목
  - `body`: 일반 화면 본문
  - `bodyReading`: 공지·약관 등 긴 글 본문
  - `meta`: 날짜·장소·설명
  - `caption`: 보조 문구
- 최근 공개 안내 페이지와 아티스트·페스티벌 상세, 달력 공개 컴포넌트를 연결한다.
- `lib/types.ts`의 공통 데이터 타입과 화면 내부 중복 데이터 타입도 함께 정리한다.

## 제외 범위

- 관리자 화면의 타이포그래피
- 색상·여백·테두리·레이아웃 변경
- 디자인이 다른 항목을 임의로 같은 스타일로 변경하는 작업

## 예상 수정 파일

- `lib/typography.ts`
- `lib/types.ts`
- `app/artist/[id]/page.tsx`
- `app/festival/[id]/page.tsx`
- `components/public/PublicInfoPage.tsx`
- `components/PublicFooter.tsx`
- `components/Calendar.tsx`
- `components/calendar/*.tsx`
- `components/festival/*.tsx`
- `components/FestivalCard.tsx`
- `components/FestivalDetailDrawer.tsx`
- `components/FestivalList.tsx`

## 작업 순서

1. 공개 화면의 현재 글자 스타일과 용도를 대조한다.
2. 모양과 역할이 모두 같은 항목만 공통 역할로 묶는다.
3. 같은 역할로 보이지만 크기·굵기가 다른 항목은 목록으로 사용자에게 질문한다.
4. 승인된 기준을 `lib/typography.ts`에 정의한다.
5. 공개 화면의 개별 Tailwind 글자 클래스를 공통 정의로 교체한다.
6. 중복 데이터 타입을 `lib/types.ts`로 통합한다.
7. 타입 검사, ESLint, 관련 테스트를 실행한다.
8. localhost에서 달력·축제 상세·아티스트 상세·정보 페이지의 PC와 모바일 화면을 확인한다.

## 회귀 위험과 검증

- Tailwind가 공통 문자열의 클래스를 누락할 위험: 클래스명을 완전한 정적 문자열로 정의하고 빌드로 확인한다.
- 반응형 크기가 달라질 위험: 모바일·PC 화면을 각각 확인한다.
- 같은 글자처럼 보여도 역할이 다른 항목을 합칠 위험: 불명확한 항목은 변경 전에 사용자에게 묻는다.
- 데이터 타입 통합으로 조회 결과 타입이 어긋날 위험: 타입 검사와 관련 화면 데이터 조회를 확인한다.

## 후속 개선점

- 공개 화면 통합 완료 후 필요하면 관리자 화면 타이포그래피를 별도 계획으로 정리한다.

## 실제 결과

- 공개 화면의 글자 크기·굵기·줄간격을 `lib/typography.ts`의 역할별 정적 클래스에서 관리하도록 변경했다.
- 독립된 축제 상세 페이지와 아티스트 상세 페이지는 `pageTitle`, `sectionTitle`, `body`, `meta` 체계를 함께 사용한다.
- 달력 옆 축제 상세 패널은 `panelTitle`, `panelSectionTitle`, 패널 본문 체계로 분리했다.
- 긴 글 본문은 `bodyReading`, 일반 화면 본문은 `body`로 구분했다.
- 달력·공개 검색·카드·푸터·정책 페이지의 기존 글자 모양을 유지하면서 공통 정의에 연결했다.
- 달력 날짜와 공개 아티스트·축제 요약에서 중복되던 데이터 타입을 `lib/types.ts`로 통합했다.

## 검증 결과

- `npm.cmd run typecheck` 통과
- 변경 파일 ESLint 통과
- `npm.cmd test` 138개 통과
- 프로덕션 빌드의 컴파일과 TypeScript 단계 통과
- 빌드의 정적 페이지 생성은 실행 환경에서 `.env.local` 읽기가 차단되어 중단됐다.
- 브라우저 보안 정책으로 localhost에 접근하지 못해 PC·모바일 실제 화면 확인은 남아 있다.
