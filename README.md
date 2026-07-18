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
- `/admin/festival-candidates`: 헤르메스 JSON 업로드와 수집 후보 검토

## 데이터베이스 적용

Supabase SQL Editor에서 `supabase/migrations`의 SQL을 번호 순서대로 적용한다. 운영 DB 구조는 `DATABASE.md`, 보안 규칙은 `SECURITY.md`를 확인한다.

## 배포

원본 저장소에서 검사 명령을 모두 통과시킨 뒤 GitHub에 푸시한다. GitHub와 연결된 Vercel이 배포를 진행한다.

## 프로젝트 문서

- `ARCHITECTURE.md`: 주요 폴더와 파일 역할
- `HERMES_IMPORT.md`: 헤르메스 사진 추출 JSON 규격과 작업 흐름
- `SECURITY.md`: 관리자 인증, RLS, Storage 보안
- `DATABASE.md`: 운영 DB 칼럼
- `supabase/DATABASE_SCHEMA.md`: 테이블 관계와 제약
- `PROJECT_CONTEXT.md`: 작업 현황과 다음 작업
