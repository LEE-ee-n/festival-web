# 티켓 탐색 실행 데이터 프로젝트 이동 계획

상태: 승인·진행 중

## 목적

바탕화면 `festival-crwaler` 폴더의 티켓 탐색 실행 데이터를 프로젝트 내부 Git 제외 경로로 이동한다. 기존 폴더는 삭제하고 바탕화면 바로 아래에 사용자가 실행하는 CMD 하나만 남긴다.

## 확정 범위

- 새 실행 데이터 경로: `C:\Users\소닉스\Documents\festibom\crawler-output\ticket-discovery`
- 바탕화면 유지 파일: `C:\Users\소닉스\Desktop\ticket-discovery-report.cmd`
- 이동 대상:
  - `crawl\`
  - `reports\`
  - `discord-webhook-url.txt`
- `discovery\`는 파생 결과이므로 새 경로에서 실행 시 다시 생성한다.
- 제거 대상:
  - `scheduled\`
  - 기존 `discovery\`
  - `discovery-nol.cmd`
  - `discovery-ticketlink.cmd`
  - `discovery-yes24.cmd`
  - 오래된 Discord Bot 바로가기
  - `copy-festival-json.cmd`
  - `copy-festival-json.log`
  - `imageTojson\`
  - `WebImage\`
- `reports\`의 후보 번호와 제외 URL은 그대로 보존한다.
- 웹훅 파일은 Git에서 제외되는 `crawler-output\` 아래에만 둔다.
- 북마클릿은 수정하지 않으며 웨일의 기본 다운로드 폴더에 JSON을 생성한다.
- 실행 순서는 `웨일 다운로드 → 새 crawl로 원본 복사 → crawl의 오늘 JSON 3개 확인 → DB 비교 → Discord 전송`으로 고정한다.

## 작업 순서

- [x] 프로젝트 대상 경로를 만들고 절대경로를 확인한다.
- [x] `crawl`, `reports`, 웹훅 파일을 복사하고 파일 개수·SHA-256을 원본과 비교한다.
- [x] 크롤러 CMD 실행기와 Discord Bot의 실행 데이터 경로를 새 경로로 변경한다.
- [x] CMD가 웨일 다운로드 폴더의 오늘 JSON을 먼저 새 `crawl`에 복사한 뒤 그 복사본만 처리하도록 코드 흐름을 변경한다.
- [x] 테스트·타입 검사·Bot 테스트를 실행한다.
- [ ] 새 경로에서 전체 비교 CMD와 Discord 제외 명령을 검증한다.
- [ ] 검증 후 바탕화면 원본 데이터와 제거 대상을 삭제한다.
- [ ] 기존 바탕화면 `festival-crwaler` 폴더가 삭제되고 바탕화면 바로 아래에 `ticket-discovery-report.cmd`만 남았는지 확인한다.
- [ ] 관련 README, 요구사항, 프로젝트 현황을 갱신한다.

## 유지할 규칙

- 프로젝트 원본과 사용자 변경사항을 보존한다.
- `.env.local`을 읽거나 수정하지 않는다.
- 웹훅 URL과 DPAPI 인증값을 출력하지 않는다.
- 복사 검증이 끝나기 전에 원본을 삭제하지 않는다.
- 바탕화면에서 삭제한 데이터는 프로젝트의 이동본으로 복구 가능해야 한다.

## 검증 항목

- 후보 번호와 제외 URL 개수 일치
- CMD가 새 경로에 `discovery`와 날짜별 보고서를 생성
- 제외한 URL이 다시 보고되지 않음
- Discord Bot의 `!티켓제외`가 새 경로에 저장
- 루트 테스트, 타입 검사, 변경 파일 ESLint, Bot 테스트 통과

## 완료 조건

- 실행 데이터가 프로젝트의 `crawler-output\ticket-discovery`에 존재한다.
- 바탕화면 `festival-crwaler` 폴더는 삭제된다.
- 바탕화면 바로 아래에 실행 CMD `ticket-discovery-report.cmd` 하나만 남는다.
- CMD 비교와 Discord 제외 명령이 새 경로에서 정상 작동한다.

## 제외 범위

- 티켓 수집·비교 규칙 변경
- DB 변경
- Instagram 자동 검색

## 후속 개선점·참고사항

- Codex 실행 계정에서는 기존 DPAPI 암호를 해독할 수 없으므로 실제 Discord 전송 검증은 사용자 Windows 계정에서 바탕화면 CMD를 실행해야 한다.
- Codex의 바탕화면 직접 쓰기 권한이 거부되어 CMD 배치와 기존 폴더 삭제는 사용자 실행 또는 추가 권한 확인이 필요하다.
