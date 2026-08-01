# [구현·운영 DB 적용 완료·실제 검증 대기] Discord 첨부 이미지 신규 페스티벌 등록

## 목적과 완료 조건

- 허용된 사용자가 Discord에 이미지와 `신규등록` 문구를 함께 보내면 Instagram을 열지 않고 첨부 이미지만 분석한다.
- 분석 결과는 기존 신규 페스티벌 작업함(`/admin/festival-candidates`)에 저장한다.
- 기존 Instagram 게시물 URL 수집 동작은 그대로 유지한다.

## 확정 범위

- `신규등록` 문구와 이미지 첨부가 함께 있을 때만 실행한다.
- Discord가 이미지로 판정한 JPG, PNG, WebP, GIF 첨부를 지원하며 GIF는 대표 첫 프레임을 사용한다.
- 여러 이미지가 있으면 기존 Codex 이미지 분석에 함께 전달하고 첫 이미지를 임시 포스터로 사용한다.
- 메시지의 `신규등록` 이외 텍스트는 캡션 근거로 함께 전달한다.
- 출처 URL은 고유한 Discord 메시지 주소, 출처 유형은 `discord_attachment`로 저장한다.
- `official_url`, `instagram_url`, 운영 썸네일 URL은 빈 검토값으로 둔다.
- 첨부 경로는 사용자가 명시한 신규 작업으로 저장하고, 기존 축제 업데이트 작업함으로 자동 분기하지 않는다.
- 허용되지 않은 형식, 빈 첨부, 다운로드·변환 실패는 작업을 만들지 않고 Discord에 오류를 표시한다.

## 제외 범위

- Instagram GIF·동영상 크롤링 로직 수정
- Discord 동영상 첨부 분석
- 일반 사진 메시지의 자동 등록
- 기존 축제 업데이트 자동 연결
- 관리자 등록 화면 구조 변경

## 예상 수정 파일과 데이터 흐름

- `operations/discord-instagram-bot/src/bot.js`
  - 첨부 메시지 분기, 다운로드·WebP 변환, 기존 OCR·아티스트 매칭·신규 후보 저장 흐름 연결
- `operations/discord-instagram-bot/src/discordAttachment.js`
  - 명령과 이미지 첨부 판정, 허용 형식 검증을 순수 함수로 분리
- `operations/discord-instagram-bot/tests/discordAttachment.test.js`
  - 명령·첨부 형식·일반 메시지 오작동 방지 테스트
- `operations/discord-instagram-bot/README.md`
  - 실행 방법과 지원 형식 기록
- `supabase/migrations/049_discord_attachment_candidate_source.sql`
  - 기존 후보 생성 함수가 Discord 메시지 출처를 허용하고 `discord_attachment` 유형을 기록하도록 확장
- `DATABASE.md`, `FESTIVAL_INGESTION_FLOW.md`, `PROJECT_STATUS.md`
  - 실제 적용 흐름과 운영 DB 적용 여부 기록

데이터 흐름:

`신규등록 + 이미지 첨부` → Discord CDN 다운로드 → 이미지 내용 검증·WebP 변환 → Codex OCR·JSON → 아티스트 DB 매칭 → 신규 후보 저장 → 관리자 작업함 검토

## 작업 순서

1. 메시지 명령과 이미지 첨부 판정 함수를 추가하고 단위 테스트한다.
2. 첨부 다운로드·변환과 기존 Codex 분석 흐름을 연결한다.
3. 결과를 신규 후보로만 저장하고 DB 재시도 버튼을 재사용한다.
4. Discord 첨부 출처를 허용하는 Migration 049와 문서를 작성한다.
5. Bot 테스트, 웹 관련 테스트, 타입 검사·린트를 실행한다.
6. 사용자가 운영 DB에 Migration 049를 적용한 뒤 실제 Discord 첨부 1건으로 검증한다.
7. 검증된 Bot 원본을 기존 CMD 복사 절차로 실행용 폴더에 반영한다.

## 회귀 위험과 검증 방법

- 일반 사진이 잘못 등록될 위험: `신규등록` 문구와 지원 이미지 첨부가 모두 있어야 작동하는 테스트를 둔다.
- URL 수집과 충돌할 위험: 첨부 명령을 독립 분기로 처리하고 기존 Instagram URL 테스트·Bot 전체 테스트를 실행한다.
- 이미지 확장자 위장 위험: Discord 메타데이터뿐 아니라 다운로드한 실제 이미지 내용을 Sharp로 해석할 수 있을 때만 처리한다.
- 중복 작업 위험: Discord 메시지 주소를 고유 출처로 사용해 같은 메시지 재처리를 차단한다.
- 기존 축제 오등록 위험: 최종 관리자 승인 단계의 동일 축제 검사를 유지한다.

## 후속 개선점

- 실제 사용에서 필요할 때만 Discord 동영상 프레임 추출을 별도 계획으로 검토한다.
- GIF의 여러 프레임 분석이 필요한 사례가 확인되면 프레임 수와 추출 간격을 별도로 결정한다.

## 실제 구현 결과

- `신규등록`으로 시작하는 메시지와 이미지 첨부가 함께 있을 때만 별도 수집 경로가 작동한다.
- JPG·PNG·WebP·GIF를 최대 5장, 각 25MB까지 받아 WebP로 변환하고 기존 Codex OCR·JSON 생성에 전달한다.
- 첨부 메시지는 Instagram 브라우저를 열지 않고 Discord 메시지 URL과 `discord_attachment` 출처 유형을 사용한다.
- 결과는 `work_type = new`로 신규 작업함에만 저장하며 관리자 최종 승인 단계의 동일 축제 차단은 유지한다.
- Bot 테스트 25개, Node 구문 검사, 변경 파일 ESLint, 웹 테스트 173개와 타입 검사가 통과했다.
- Migration 049를 운영 DB에 적용했고 내부 후보 함수 직접 실행 차단, 등록 RPC authenticated 전용 권한과 Discord 첨부 분기를 확인했다.
- 실행용 Bot 복사와 실제 Discord 첨부 검증은 남아 있다.
