# Festival Web

국내 페스티벌 일정, 출연진, 티켓 정보를 달력으로 제공하고 관리자가 데이터를 등록·수정하는 Next.js 웹사이트다.

## 기술 구성

- Next.js 16 / React 19 / TypeScript
- Tailwind CSS
- Supabase Auth, Database, Storage
- Vercel 배포

## 로컬 실행

Node.js 24 사용을 권장한다.

```cmd
cd /d "C:\Users\소닉스\Documents\Codex\festival-web-work"
npm install --cache .npm-cache
npm run dev
```

Supabase 연결에는 로컬 `.env.local` 파일에 다음 환경변수가 필요하다.

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

환경변수 파일은 Git에 올리지 않는다.

## 검사 명령

```cmd
npm test
npm run lint
npm run typecheck
npm run build
npm run check
```

- `npm test`: 캘린더, 티켓, 썸네일 핵심 규칙 검사
- `npm run lint`: 코드 규칙 검사
- `npm run typecheck`: TypeScript 타입 검사
- `npm run build`: 배포용 프로덕션 빌드 검사
- `npm run check`: 위의 모든 검사를 순서대로 실행

GitHub에 올리기 전에 로컬에서 `npm run check`를 실행하고, `npm run dev`로 실제 화면과 Supabase 기능을 확인한다.

## 주요 주소

- `/`: 월간 페스티벌 달력
- `/festival/[id]`: 축제 상세 페이지
- `/artist/[id]`: 아티스트 상세 페이지
- `/admin`: 관리자 홈
- `/admin/festivals`: 축제 목록 관리
- `/admin/festivals/[id]/lineup`: 축제 기본정보, 출연진, 티켓 관리
- `/admin/festival-candidates`: 직접 작성·Instagram 수집자료를 단계별로 검토하는 신규 페스티벌 등록

## 데이터베이스 적용

Supabase SQL Editor에서 `supabase/migrations`의 SQL을 번호 순서대로 적용한다. 운영 DB 구조는 `DATABASE.md`, 보안 규칙은 `SECURITY.md`를 확인한다.

## 배포

원본 저장소에서 검사 명령을 모두 통과시킨 뒤 GitHub에 푸시한다. GitHub와 연결된 Vercel이 배포를 진행한다.

## 프로젝트 문서

- `PROJECT_STATUS.md`: 모든 작업의 시작점. 전체 진행도, 최근 업데이트, 검증 상태와 다음 작업
- `FESTIVAL_INGESTION_FLOW.md`: 축제 수집·5단계 등록 규칙과 코드 연결
- `DATABASE.md`: 운영 DB 칼럼·RPC·감사 로그
- `ARTIST_MANAGEMENT.md`: 아티스트 등록·수정 규칙
- `ARCHITECTURE.md`: 주요 폴더와 파일 역할
- `SECURITY.md`: 관리자 인증, RLS, Storage 보안
- `CRAWLER_REQUIREMENTS.md`: 티켓 목록 크롤러의 범위와 검수 기준
