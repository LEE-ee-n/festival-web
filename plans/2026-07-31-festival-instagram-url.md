# [완료] 축제 Instagram 계정 URL 분리

## 목적과 완료 조건

- 축제 홈페이지 URL과 공식 Instagram 계정 URL을 서로 다른 필드로 관리한다.
- Discord Instagram Bot이 게시글 작성자 프로필 URL을 추출해 검토 초안에 저장한다.
- 관리자가 신규 등록 또는 기존 축제 수정의 최종 검토에서 확인한 뒤 `festivals.instagram_url`에 반영한다.
- 게시글 URL은 기존처럼 수집 출처 `source_url`로 유지한다.

## 확정 범위

- `festivals.instagram_url` nullable text 칼럼 추가
- Bot에서 일반 게시글 작성자 프로필 링크를 `https://www.instagram.com/{계정명}/` 형식으로 정규화
- 수집 초안의 `festival.instagram_url`에 프로필 URL 저장
- 신규 축제 등록과 기존 축제 수정의 기본정보 검토·저장 흐름에 Instagram URL 추가
- 페스티벌 관리 기본정보에 Instagram URL 입력란 추가
- 공개 축제 상세에서 홈페이지 URL과 Instagram URL을 각각 표시
- DB 타입, 공통 타입, 감사 변경명과 관련 문서 갱신

## 제외 범위

- Instagram 계정이 실제 공식 계정인지 자동 판정
- Instagram 외 YouTube, Facebook, X 등 다른 SNS 지원
- 릴스 화면 구조에 대한 별도 추출·검증
- 여러 Instagram 계정 저장
- 게시글 URL `source_url` 구조 변경
- 기존 데이터의 Instagram URL 일괄 채우기

## 예상 수정 파일과 데이터 흐름

- `operations/discord-instagram-bot/src/bot.js`
- `operations/discord-instagram-bot/src/codex-output.schema.json`
- 축제 초안·비교·기본정보 저장 관련 공통 타입과 함수
- 신규 후보 및 기존 수정 검토 화면
- 페스티벌 관리 기본정보와 공개 상세 링크 컴포넌트
- Supabase migration 및 `lib/supabase/database.types.ts`
- 관련 테스트, `DATABASE.md`, `FESTIVAL_INGESTION_FLOW.md`, `PROJECT_STATUS.md`

데이터 흐름:

1. Bot이 Instagram 게시글에서 작성자 프로필 링크를 추출한다.
2. 게시글 주소는 `candidate.source_url`, 프로필 주소는 `festival.instagram_url`에 넣는다.
3. 신규·기존 작업함에서 관리자가 값을 검토하고 필요하면 수정한다.
4. 최종 승인 시 `festivals.instagram_url`에 저장한다.
5. 공개 상세에서는 `official_url`과 `instagram_url`을 별도 링크로 표시한다.

## 작업 순서

1. Bot에 저장 없이 작성자 후보 링크와 정규화 결과만 기록하는 추출 로직을 추가한다.
2. Bot이 사용하는 로그인된 Chrome에서 실제 일반 게시물을 열어 작성자 프로필이 정확히 추출되는지 먼저 확인한다.
3. 실제 검증에 통과한 DOM 범위를 단위 테스트 fixture로 고정한다.
4. DB 칼럼과 저장 RPC를 확장한다.
5. 초안 파서·비교·타입과 신규/기존 검토 흐름을 연결한다.
6. 관리 화면 입력 및 공개 상세 링크를 추가한다.
7. 전체 저장 흐름과 화면을 검증하고 관련 문서를 갱신한다.
8. Bot 원본 검증 후 실행용 복사 명령을 제공한다.

## 회귀 위험과 검증 방법

- 게시글 본문 내 다른 계정 링크를 작성자로 오인하지 않도록 게시글 헤더 범위에서만 추출한다.
- 실제 게시물에서 프로필 이름을 눌렀을 때 이동하는 주소와 추출 결과가 같은지 대조한다.
- 일반 게시물 최소 1건을 확인하고, 실제 검증 실패 시 DB·화면 구현으로 넘어가지 않는다.
- `/p/`, `/reel/`, `/explore/` 같은 비프로필 경로를 거부하는 단위 테스트를 작성한다.
- 추출 실패 시 크롤링 전체를 실패시키지 않고 `instagram_url`만 빈 값으로 둔다.
- 기존 축제의 Instagram URL은 관리자가 선택·확정하기 전 운영 데이터에 반영하지 않는다.
- `official_url`, `source_url`, `instagram_url`이 서로 덮어쓰지 않는지 신규·기존 흐름을 각각 검사한다.
- 관련 단위 테스트, 타입 검사, 린트와 localhost 공개·관리 화면을 확인한다.
- migration 작성과 운영 DB 적용 완료 상태를 구분해 기록한다.

## 선행 DOM 확인 결과

- 2026-07-31 실제 Instagram 게시물 작성자 영역 HTML을 확인했다.
- 작성자 링크는 `a[role="link"]`이며 `href="/pajucf/?e=...&g=5"`, 표시 텍스트는 `pajucf`로 확인됐다.
- 저장 시 쿼리 문자열을 제거하고 `https://www.instagram.com/pajucf/`로 정규화한다.
- 같은 작성자 영역에서 `alt="pajucf님의 프로필 사진"`, 팔로우 버튼, 위치 링크, 옵션 버튼을 함께 확인했다.
- 동적 class는 사용하지 않고 프로필 단일 경로, 링크 텍스트 일치, 작성자 영역 위치를 조합해 판별한다.
- 일반 게시물 구조 확인으로 이번 추출 범위의 선행 DOM 검증을 완료했다.

## 후속 개선점

- 필요해질 경우 여러 SNS를 저장하는 별도 `festival_social_links` 구조를 검토한다.
- 공식 계정 검증 상태나 마지막 확인일이 필요하면 별도 메타데이터로 추가한다.

## 구현 결과

- 실제 제공된 일반 게시물 작성자 HTML에서 `/pajucf/?e=...&g=5`를 확인하고 `https://www.instagram.com/pajucf/`로 정규화하는 로직과 테스트를 추가했다.
- Bot 초안의 `festival.instagram_url`, 신규·기존 최종 검토, 관리자 기본정보, 공개 상세 링크를 연결했다.
- `festivals.instagram_url`과 감사 저장 흐름을 추가하는 Migration 047을 작성했다.
- 실제 Discord 수집 로그에서 `https://www.instagram.com/steppingstonefestival/` 프로필 추출까지 성공했다.
- 첫 실사용에서 Codex strict JSON 스키마의 `instagram_url` 필수 선언 누락과 Discord 오류 메시지 2,000자 초과를 확인해 수정했다.
- strict object의 모든 속성 필수 선언 검사와 Discord 오류 길이 제한 테스트를 추가했으며 Bot 테스트 20개, 전체 테스트 156개, 타입 검사, 변경 파일 ESLint, Bot 구문·JSON 스키마 검사가 통과했다.
- 프로덕션 빌드는 컴파일·타입 검사 후 `.env.local` 읽기 제한으로 정적 페이지 생성 단계에서 중단됐다.
- Migration 047을 운영 DB에 적용하고 `instagram_url` 칼럼, 형식 제약조건과 관련 함수 5개를 확인했다.
- 현재 실행 로그에서 Bot이 프로젝트 원본 폴더를 직접 사용하는 것을 확인해 별도 복사는 생략한다.
- 수정된 Bot으로 동일 게시물을 다시 수집해 `instagram_profile_url=https://www.instagram.com/steppingstonefestival/` 추출과 DB 임시 작업 `saved_id=99` 생성을 확인했다.
- 관리 화면의 실제 표시값과 최종 승인 여부는 사용자가 임시 작업 99번에서 확인한다.
