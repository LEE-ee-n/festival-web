# 홈·아티스트 페이지 SEO 기본정보

## 목적과 완료 조건

- 사람과 검색엔진이 홈과 아티스트 상세 페이지의 목적을 제목만으로 이해할 수 있다.
- 기존 URL, 조회 기능과 상세 화면 구조는 유지한다.
- 각 페이지에 정확한 `title`, `description`, H1을 하나씩 제공한다.

## 확정 범위

### 홈 `/`

- title: `전국 밴드 페스티벌 일정·라인업·티켓 | 페스티봄`
- description: `전국 밴드 페스티벌의 일정, 개최 장소, 출연 라인업, 타임테이블과 티켓 정보를 한눈에 확인하세요.`
- 달력 위에 짧은 H1과 설명을 표시한다.
- 현재 월 제목은 H1에서 H2로 변경한다.

### 아티스트 `/artist/[id]`

- title: `{아티스트명} 출연 페스티벌 일정 | 페스티봄`
- description: `{아티스트명}이 출연했거나 출연 예정인 페스티벌 정보를 확인하세요.`
- 화면에 이미 표시되는 아티스트명을 H1으로 유지한다.
- 서버의 `generateMetadata`에서 공개 아티스트 이름을 조회한다.

## 예상 수정 파일

- `app/page.tsx`
- `components/calendar/CalendarHeader.tsx`
- `app/artist/[id]/layout.tsx`
- `PROJECT_STATUS.md`

## 제외 범위

- `/festival/[id]` 메타데이터
- 숫자 ID URL을 slug URL로 변경
- Open Graph 이미지와 구조화 데이터
- 상세 페이지 디자인과 데이터 조회 구조 개편

## 회귀 위험과 검증

- H1 중복 여부 확인
- 존재하지 않는 아티스트의 기본 메타데이터 확인
- 공개 RLS 환경에서 서버 메타데이터 조회 확인
- 린트, 타입 검사, 전체 테스트와 프로덕션 빌드
- localhost에서 홈과 아티스트 페이지의 title·description·H1 확인

## 후속 개선점

- 페스티벌 상세 동적 메타데이터
- canonical URL, Open Graph 및 JSON-LD 구조화 데이터
