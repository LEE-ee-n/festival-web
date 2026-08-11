# Festibom 작업 규칙

## 기본 원칙

- 답변은 사용자가 판단하거나 실행하는 데 필요한 내용만 간결하고 직접적으로 작성한다.
- 사용자가 설명·진단만 요청하면 코드를 수정하지 않는다.
- 기능 방향, 범위, 동작, 데이터 구조, 삭제 여부 등 결과에 영향을 주는 판단은 사용자가 결정한다.
- 여러 방법이 가능하거나 요청이 불명확하면 선택지와 영향을 설명하고 사용자 판단을 받은 뒤 진행한다.
- 승인된 계획 안의 단순 구현 세부사항은 반복해서 묻지 않고 계획대로 끝까지 처리한다.
- 요청 범위 밖의 기능을 임의로 추가하지 않는다. 발견한 개선점은 후속 작업으로 기록한다.
- 사용자 변경사항과 관련 없는 파일을 수정하거나 되돌리지 않는다.
- 도구 실행 성공과 사용자가 실제 화면·동작을 확인한 상태를 구분한다.

## 단일 원본과 보안

- 홈페이지와 운영 코드의 단일 원본은 `C:\Users\소닉스\Documents\festibom`이다.
- Discord Bot 원본은 `operations/discord-instagram-bot`이다.
- 외부 Bot 폴더는 실행용 복사본이므로 직접 수정하지 않는다.
- Bot 변경은 원본에서 검증한 뒤 CMD 복사 명령으로 실행 폴더에 반영한다.
- `.env`, `.env.local`, `.env.*`의 내용을 읽거나 출력하거나 문서에 기록하지 않는다.
- Discord Bot의 기존 DPAPI 인증 방식을 유지하고 홈페이지 환경변수와 합치지 않는다.

## 작업 시작과 계획

1. 요청을 설명·진단·구현·DB 변경 중 하나로 구분한다.
2. `PROJECT_STATUS.md`와 요청에 직접 관련된 문서·코드·테스트만 확인한다.
3. 구현 전에 `plans/YYYY-MM-DD-작업명.md` 계획 문서를 작성한다.
4. 사용자에게 계획 검토를 요청하고 명시적 승인 후 구현한다.

계획 문서는 간단하더라도 다음 내용을 포함한다.

- 목적과 완료 조건
- 확정 범위와 제외 범위
- 예상 수정 파일·데이터 흐름
- 작업 순서
- 회귀 위험과 검증 방법
- 후속 개선점

- 코드, UI, DB, 권한, 처리 흐름을 변경하는 작업은 모두 계획 대상이다.
- 사용자 의견으로 계획이 바뀌면 계획 문서를 먼저 수정한다.
- 진행 중에는 완료된 항목을 표시하고, 작업 완료 후 제목에 `[완료]`와 실제 결과를 기록한다.
- 진행 상태와 다음 작업은 `PROJECT_STATUS.md`에 반영한다.

## 구현 규칙

- 초록색·파란색·빨간색 배경 박스를 임의로 만들지 않는다. 상태색 강조가 꼭 필요하면 사용자와 먼저 합의한다.
- 화면의 기본 컨테이너와 안내 영역은 흰색 바탕과 회색 계열 테두리를 우선 사용한다.
- 같은 목적의 함수·타입·컴포넌트가 있으면 새로 만들기보다 기존 공통 구현을 확장한다.
- 공통 규칙을 화면이나 Bot 내부에 중복 구현하지 않는다.
- `any`는 사용하지 않는다.
- `unknown`은 다른 방법으로 안전하게 구현할 수 없을 때만 사용한다.
- 외부 입력이나 라이브러리 경계에서 `unknown`이 불가피하면 검증 함수로 즉시 구체 타입으로 좁힌다.
- 신규 축제 등록과 기존 축제 업데이트 흐름을 섞지 않는다.
- 자동 삭제를 구현하지 않고 삭제 후보 표시와 실제 삭제 결정을 분리한다.
- 축제 `normalized_name`은 연도와 `festival`을 제거한 뒤 영문 소문자와 숫자만 남긴다.
- 아티스트 `normalized_name`은 특수문자를 제거하고 영문 소문자와 숫자만 남긴다.
- 포스터의 아티스트 원문 표기는 `input_name`에 보존한다.

## 문서와 DB

- 코드 흐름이 바뀌면 관련 흐름 문서와 실제 구현을 함께 갱신한다.
- 새 문서를 만들기 전에 기존 문서에 합칠 수 있는지 확인한다.
- DB 변경 시에만 관련 스키마, migration, RPC, RLS, 인덱스와 코드 사용처를 확인한다.
- 새 DB 객체를 만들기 전에 같은 목적의 기존 객체가 있는지 확인한다.
- migration 파일 작성만으로 운영 DB에 적용됐다고 간주하지 않는다.
- DB 변경 후 관련 테스트와 실제 적용 결과를 확인하고 `DATABASE.md`를 갱신한다.
- 한글 SQL·JSON은 `Get-Content -Raw -Encoding UTF8 | Set-Clipboard`로 전달한다.
- SQL 전달 전 UTF-8로 다시 읽어 한글과 따옴표가 정상인지 확인한다.

## 검증

- 변경 범위에 맞춰 관련 단위 테스트, 기능 테스트, 타입 검사와 린트를 실행한다.
- 공통 로직이나 영향 범위가 넓으면 전체 테스트를 실행한다.
- 화면 변경은 localhost에서 실제 화면과 오류를 확인한다.
- DB 변경은 적용 전 SQL을 검토하고 적용 후 실제 스키마 또는 동작을 확인한다.
- 자동 생성 파일이나 외부 파일 오류는 작성 코드 오류와 구분한다.
- 검증하지 못한 항목은 완료라고 표현하지 않고 이유를 밝힌다.

## 작업 효율과 완료 보고

- 이미 문서로 확인한 내용은 변경 근거가 없으면 반복 조사하지 않는다.
- 전체 조사보다 변경 파일과 직접 영향 범위를 먼저 확인한다.
- 권한·로그인·외부 상태 때문에 반복 실패하면 우회하지 말고 사용자 실행 명령을 즉시 제공한다.
- GitHub 저장소·PR·이슈 작업은 설치된 GitHub 플러그인 연결을 우선 사용한다.
- Codex 격리 터미널의 `gh auth status` 실패만으로 사용자에게 GitHub 재로그인을 반복 요청하지 않는다.
- GitHub 플러그인이 지원하지 않는 `gh` 전용 조회가 필요하고 격리 터미널에서 인증이 보이지 않으면, 마스킹된 사용자 실행 명령을 한 번 제공하고 사용자가 전달한 결과를 기준으로 완료한다.
- 사용자 명령은 현재 위치에 의존하지 않는 절대경로로 작성한다.
- 배포·복사 시 이번 작업에서 수정된 파일만 대상으로 하고 `.env`, 생성 파일, 실행 캐시는 제외한다.
- 완료 보고에는 수정 내용, 검증 결과, 남은 문제만 간결하게 적는다.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
