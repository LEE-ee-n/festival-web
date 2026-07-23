# [완료] Supabase 운영 DB 타입 연결 계획

- 작성일: 2026-07-23
- 상태: 구현·코드 검증 완료
- 승인일: 2026-07-23
- 대상: 웹 애플리케이션의 Supabase 테이블·관계·RPC 타입
- DB 변경: 없음

## 한눈에 보는 요약

- 운영 Supabase `public` 스키마에서 공식 TypeScript 타입을 생성한다.
- 웹 Supabase 클라이언트를 `createClient<Database>`로 연결한다.
- 연결 후 드러나는 테이블·관계·RPC 타입 오류를 임시 강제 변환 없이 전부 해결한다.
- DB 결과를 우회하는 `as unknown as`는 이번 범위에서 제거한다.
- JSON·XLSX 같은 외부 입력 경계의 기존 `unknown` 전체 정리는 이번 작업에 섞지 않고 후속 작업으로 남긴다.

## 현재 상태

- `lib/supabase/client.ts`는 `createClient(supabaseUrl, supabaseAnonKey)`로 생성되어 DB 타입이 연결되지 않았다.
- 웹에서 Supabase를 사용하는 TypeScript 파일은 39개다.
- 전체 TypeScript 코드에 타입 용도의 `unknown` 69개, `as unknown as` 9개, `Record<string, unknown>` 16개, 명시적 `any` 0개가 있다.
- `as SomeType` 형식의 타입 단언이 약 68개 있으며 상당수가 Supabase 조회 결과를 수동으로 맞춘 것이다.
- 운영 DB는 migration 004~041 적용 상태로 문서화되어 있으므로 migration 추정본이 아니라 운영 스키마에서 타입을 생성해야 한다.
- Supabase CLI는 현재 프로젝트 의존성에 없으며 로컬 실행 확인도 완료되지 않았다.

## 확정 범위

### 1. 공식 DB 타입 생성 기반 추가

- 공식 Supabase CLI를 개발 의존성으로 고정한다.
- 운영 프로젝트의 `public` 스키마에서 `lib/supabase/database.types.ts`를 생성한다.
- 프로젝트 참조 ID는 공개 식별값으로만 사용하고 접근 토큰·DB 비밀번호는 코드나 문서에 저장하지 않는다.
- `package.json`에 동일 경로로 다시 생성할 수 있는 `db:types` 명령을 추가한다.
- 생성 파일은 수동 편집하지 않고 운영 스키마의 스냅샷으로 관리한다.

### 2. Supabase 클라이언트 타입 연결

- `lib/supabase/client.ts`에 생성된 `Database` 타입을 연결한다.
- 환경변수 처리와 인증 옵션은 변경하지 않는다.
- Discord Bot은 JavaScript 클라이언트이므로 이번 TypeScript 연결 범위에서 제외한다.

### 3. 테이블·관계 조회 타입 정리

- 39개 Supabase 사용 파일을 타입 검사 결과에 따라 범위 검색한다.
- 테이블 행·추가·수정 타입은 생성된 `Tables`, `TablesInsert`, `TablesUpdate` 계열을 우선 사용한다.
- 관계 조회는 쿼리에서 파생한 `QueryData<typeof query>` 또는 생성된 관계 타입을 사용한다.
- 실제 쿼리 결과와 다른 페이지별 `FestivalRecord`, `ArtistRow`, `TicketRow` 타입은 공통 DB 타입을 기반으로 정리한다.
- 타입 오류를 숨기기 위해 `as unknown as`나 새 `any`·`unknown`을 추가하지 않는다.

### 4. RPC 입력·결과 타입 정리

- 생성된 `Database["public"]["Functions"]`의 Args·Returns를 기준으로 모든 RPC 호출을 검사한다.
- RPC 인수명, nullable 여부, JSON 인수 구조가 운영 함수 정의와 맞지 않으면 호출부를 수정한다.
- JSON으로 반환되는 RPC는 화면에서 바로 단언하지 않고 구체적인 결과 타입과 검증 함수로 좁힌다.
- 기존 기능 동작과 저장 데이터는 변경하지 않는다.

### 5. 기준 수치 재점검

- 작업 후 `unknown`, `as unknown as`, `Record<string, unknown>`, 일반 타입 단언 수를 다시 집계한다.
- Supabase 결과 우회용 `as unknown as`는 0개를 완료 조건으로 한다.
- 외부 JSON·XLSX 입력 검증과 일반 감사 스냅샷처럼 이번 범위 밖의 `unknown`은 위치와 이유를 후속 항목으로 기록한다.

## 예상 수정 파일

- `package.json`
- `package-lock.json`
- 신규 생성: `lib/supabase/database.types.ts`
- `lib/supabase/client.ts`
- 타입 오류가 발생하는 `app`, `components`, `lib` 아래 Supabase 사용 파일
- 필요한 DB 쿼리 결과 검증 함수와 관련 단위 테스트
- `DATABASE.md`
- `ARCHITECTURE.md`
- 이 계획 문서와 `PROJECT_STATUS.md`

정확한 사용 파일 목록은 생성 타입을 연결한 직후 `tsc` 결과로 확정하고, Supabase를 사용하지 않는 파일은 수정하지 않는다.

## 작업 순서

1. 공식 CLI 개발 의존성과 재생성 명령 추가
2. 운영 `public` 스키마 타입 생성
3. 생성 타입에 migration 004~041의 핵심 테이블·RPC가 포함됐는지 확인
4. 웹 Supabase 클라이언트에 `Database` 연결
5. 테이블 조회 타입 오류 해결
6. 관계 조회 타입 오류 해결
7. RPC Args·Returns 타입 오류 해결 및 JSON 결과 검증 추가
8. 단위 테스트 → 관련 기능 테스트 → 전체 테스트 → typecheck → lint → build
9. 타입 사용 수치와 문서 갱신
10. localhost에서 공개 조회와 관리자 주요 화면 회귀 확인

## 유지할 규칙

- 운영 DB 스키마와 migration은 변경하지 않는다.
- `.env`, 접근 토큰, DB 비밀번호를 읽거나 저장소에 기록하지 않는다.
- 생성 타입을 맞추기 위해 실제 DB 구조를 추측하거나 수동 왜곡하지 않는다.
- 기존 신규 페스티벌 등록과 기존 페스티벌 수정 흐름을 섞지 않는다.
- 아티스트 연결은 `artist_id`, 자동 판정은 `normalized_name` 100% 일치 규칙을 유지한다.
- 타입 정리를 이유로 화면 동작·저장 동작·디자인을 변경하지 않는다.
- 새 `any`, 새 `unknown`, 새 이중 단언을 만들지 않는다.

## 예외 상황

- CLI 로그인이 없으면 사용자가 `npx supabase login`을 한 번 실행한 뒤 계속한다.
- 운영 타입 생성 결과와 `DATABASE.md` 또는 migration이 다르면 코드를 억지로 맞추지 않고 스키마 불일치로 기록하고 사용자에게 확인받는다.
- 생성 타입에서 관계가 누락되면 먼저 실제 FK 유무를 확인하며 임의 관계 타입으로 덮지 않는다.
- RPC 반환이 `Json`이면 런타임 검증 없이 구체 타입으로 강제 변환하지 않는다.

## 검증 항목

- 생성 타입에 현재 사용하는 모든 테이블·뷰·RPC 포함
- `createClient<Database>` 연결 확인
- Supabase 사용 39개 파일의 타입 오류 0개
- Supabase 결과 우회 목적의 `as unknown as` 0개
- 신규 `any`·`unknown` 0개
- 기존 테스트 113개 이상 통과
- `npm run typecheck` 통과
- 변경 파일 ESLint 및 전체 lint 결과 확인
- `npm run build` 통과
- 공개 달력·축제 상세·아티스트 상세 조회 확인
- 관리자 로그인·신규 작업함·기존 수정·페스티벌 관리·감사 로그 조회 확인

## 완료 조건

- 운영 DB 타입이 재생성 가능하게 저장소에 포함된다.
- 웹 Supabase 클라이언트의 모든 테이블·관계·RPC 호출이 생성 타입을 사용한다.
- 타입 연결로 생긴 오류를 강제 단언으로 숨기지 않고 해결한다.
- 기존 주요 업무 흐름과 테스트 결과가 유지된다.
- 문서와 코드의 DB 타입 기준이 일치한다.

## 제외 범위

- DB migration·테이블·RPC·RLS 변경
- Discord Bot의 JavaScript를 TypeScript로 전환
- JSON·XLSX·크롤러 외부 입력의 기존 `unknown` 전체 제거
- 모든 페이지의 UI 전용 Props·상태 타입 통합
- 화면 디자인 또는 기능 변경
- DB 타입 자동 갱신 GitHub Actions 추가

## 후속 개선점·참고사항

- 외부 입력용 `JsonValue`와 공통 검증기 도입
- `Record<string, unknown>` 기반 병합 로직을 필드별 타입 패치 함수로 전환
- 중복된 UI·도메인 타입을 생성 DB 타입 기반으로 통합
- `audit_summary!` 비-null 단언 제거
- 필요하면 DB 타입 자동 갱신 GitHub Actions를 별도 계획으로 추가

## 실제 구현 결과

- [x] Supabase CLI를 개발 의존성으로 추가하고 `npm run db:types` 재생성 명령을 등록했다.
- [x] 운영 `public` 스키마에서 `lib/supabase/database.types.ts`를 생성했다.
- [x] 브라우저 클라이언트에 `createClient<Database>`를 연결했다.
- [x] 생성 타입이 드러낸 숫자 ID, nullable 칼럼, 관계 조회 타입을 정리했다.
- [x] Supabase 결과를 우회하던 `as unknown as`를 제거했다. 남은 5개는 기존 외부 JSON 병합 로직이며 계획의 제외 범위다.
- [x] `Json` RPC 반환과 후보 JSON·감사 요약에 구체적인 검증 함수를 추가했다.
- [x] 전체 테스트 123개와 `npm run typecheck`, 변경 파일 ESLint가 통과했다.
- [x] production build는 컴파일과 TypeScript 검사를 통과했다. Codex 권한에서 `.env.local`을 읽을 수 없어 정적 페이지 생성은 중단됐으며, 실행 중인 localhost 화면은 사용자가 정상화됨을 확인했다.
- [x] 기준 수치를 재집계했다: `unknown` 69→65, `as unknown as` 9→5, `Record<string, unknown>` 16→14. 남은 항목은 외부 JSON·XLSX·감사 스냅샷 등 후속 정리 범위다.
