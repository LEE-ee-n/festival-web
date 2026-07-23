# [완료] 티켓 사이트 누락 축제 반자동 탐색 계획

상태: 완료

## 목적

사용자가 NOL·Ticketlink·YES24에서 기존 북마클릿을 실행한 뒤 전체 비교 CMD 하나를 실행하면, 최신 JSON을 정리하고 운영 DB와 비교해 누락 후보 명단을 Discord로 전달한다.

## 확정 범위

- 원본 코드는 `C:\Users\소닉스\Documents\festibom`에서만 수정한다.
- `C:\Users\소닉스\Desktop\festival-crwaler`는 북마클릿 JSON, 결과, 로그와 실행 CMD를 보관한다.
- 사이트 접근과 북마클릿 실행은 사용자가 일반 Chrome에서 직접 한다.
- 전체 비교 CMD는 세 사이트의 최신 북마클릿 JSON을 한 번에 처리한다.
- 기존 사이트별 importer와 `classifyTicketDiscovery`를 재사용한다.
- 비교 대상은 `festivals`, `festival_candidates`, `festival_ticket_rounds`의 필요한 칼럼으로 제한한다.
- 결과는 `등록됨 / 확인 필요 / 누락 후보`로 나눈다.
- Discord에는 사이트별 처리 개수와 `확인 필요 + 누락 후보`의 제목, 일정, 사이트, URL, 판정 이유를 보낸다.
- 메시지 길이를 넘으면 여러 메시지로 분할한다.
- 명시적으로 제외한 URL만 숨기고, 나머지 검토 대상은 CMD를 실행할 때마다 모두 다시 보낸다.
- DB 저장, 홈페이지 검토 페이지 등록, Instagram 검색은 자동화하지 않는다.
- 자동 브라우저 접근과 Windows 예약 실행은 제거한다.
- Discord Bot에서 `!티켓제외 T-001, T-002` 형식으로 여러 후보 URL을 한 번에 제외한다.
- 제외는 정확한 티켓 URL만 기준으로 하며 제목 유사도는 사용하지 않는다.
- Discord 명단에서 확인 필요는 `✅`, 누락 후보는 `🆕`를 제목 앞에 표시한다.

## 현재 구현

- 세 사이트 북마클릿과 importer가 있다.
- 사이트별 CMD는 원본 JSON 하나를 정리하고 처리 개수만 Discord로 알린다.
- 관리자 화면에는 JSON 수동 업로드 후 DB 중복을 확인하는 공통 판정 함수가 있다.
- 자동 브라우저 시험은 사이트의 비정상 접근 차단과 화면 준비 문제로 운영 대상에서 제외한다.

## 목표 흐름

1. 사용자가 일반 Chrome에서 세 사이트 북마클릿을 실행한다.
2. 다운로드된 JSON은 기존 찾기 규칙으로 최신 파일을 선택한다.
3. 사용자가 바탕화면의 전체 비교 CMD를 실행한다.
4. CMD가 기존 Discord Bot DPAPI 설정에서 Supabase Bot 인증을 메모리로만 읽는다.
5. 사이트별 importer가 URL·제목·날짜를 검증하고 축제 후보만 남긴다.
6. 세 사이트 결과를 합치고 같은 URL을 중복 제거한다.
7. 운영 DB의 정식 축제·등록 후보·기존 티켓 URL과 비교한다.
8. 날짜별 비교 JSON과 실행 로그를 저장한다.
9. 새 `확인 필요 + 누락 후보`만 Discord로 보낸다.
10. 각 보고 후보에 URL별 고정 번호 `T-001` 형식을 표시한다.
11. 사용자가 Discord에서 `!티켓제외 T-001, T-002`를 보내면 Bot이 번호를 URL로 변환해 제외 목록에 저장한다.
12. 다음 CMD 실행부터 제외 URL은 DB 비교와 Discord 보고 전에 제거한다.

## 예상 수정 파일

- `package.json`, `package-lock.json`: 전체 비교 명령 추가, 자동 브라우저 의존성 제거
- `crawler/processManualDiscoveryWorkflow.ts`: 최신 세 파일 정리와 통합 실행
- `crawler/compare/loadTicketDiscoveryReferences.ts`: Bot 인증 후 DB 참조 조회
- `crawler/compare/buildTicketDiscoveryReport.ts`: 공통 판정과 통합 결과 생성
- `crawler/ticketCandidateRegistry.ts`: URL별 고정 `T-NNN` 번호와 제외 URL 목록 관리
- `crawler/notifications/discordWebhook.ts`: 명단 분할 전송
- `crawler/tools/run-manual-discovery.ps1`: DPAPI 로드와 환경변수 정리
- `crawler/tools/ticket-discovery-report.cmd`: 사용자가 실행할 전체 비교 CMD
- `operations/discord-instagram-bot/src/ticketExclusion.js`: 쉼표 명령 파싱, 번호 조회, 제외 목록 저장
- `operations/discord-instagram-bot/src/bot.js`: Instagram URL 처리 전에 티켓 제외 명령 분기
- `operations/discord-instagram-bot/scripts/run-bot.ps1`: 바탕화면 크롤러 폴더 경로 전달
- Discord Bot 테스트와 README
- 사이트별 importer와 북마클릿: 현재 URL 형식 보완이 필요한 경우 기존 구현 확장
- 관련 테스트, `crawler/README.md`, `CRAWLER_REQUIREMENTS.md`, `DATABASE.md`, `PROJECT_STATUS.md`

## 작업 순서

- [x] 반자동 흐름으로 계획과 요구사항을 변경한다.
- [x] 자동 브라우저·예약 실행 코드와 의존성을 제거한다.
- [x] 세 사이트 최신 원본을 한 번에 찾고 기존 importer로 정리한다.
- [x] DB 비교·결과 파일·반복 이력·Discord 명단 전송을 연결한다.
- [x] 전체 비교 CMD를 바탕화면 실행 폴더에 배치한다.
- [x] URL별 고정 `T-NNN` 번호를 생성하고 Discord 명단에 표시한다.
- [x] `✅ [확인 필요]`, `🆕 [누락 후보]`로 상태를 한눈에 구분한다.
- [x] `!티켓제외 T-001, T-002` 명령의 공백·쉼표·대소문자·중복 입력을 검증한다.
- [x] Bot이 유효한 번호의 URL만 제외 목록에 원자적으로 저장하고 성공·미확인 번호를 답한다.
- [x] 다음 CMD 실행에서 제외 URL이 다시 보고되지 않는지 검증한다.
- [x] Bot 원본 검증 후 실행용 복사본 반영 명령을 제공한다.
- [x] 정상·누락 파일·일부 사이트 실패·DB 실패·Discord 분할 테스트를 실행한다.
- [x] 실제 북마클릿 JSON으로 전체 비교 CMD를 1회 검증한다.
- [x] 문서와 `PROJECT_STATUS.md`를 실제 결과로 갱신한다.

## 상태 변화와 예외 상황

- 세 사이트 중 파일이 빠지면 잘못된 전체 명단을 보내지 않고 누락 사이트를 표시해 실행을 중단한다.
- DB 인증이나 조회가 실패하면 누락 판정을 만들지 않는다.
- importer에서 제외된 항목은 결과에 포함하지 않고 사이트별 제외 개수로 기록한다.
- Discord 전송 실패 시 결과 JSON과 로그를 보존한다.
- 일정이 없는 항목은 URL이 같을 때만 등록됨으로 확정하고 나머지는 확인 필요 또는 누락 후보로 남긴다.
- 같은 축제의 좌석·회차별 URL은 제목·날짜로 비교하되 원본 URL은 보존한다.
- 후보 번호는 URL별로 한 번 발급한 뒤 이후 실행에서도 유지한다.
- 쉼표 목록 일부가 잘못돼도 유효한 번호는 저장하고, 찾지 못한 번호는 답변에 구분한다.
- 이미 제외된 번호를 다시 입력하면 중복 저장하지 않고 이미 제외됨으로 처리한다.
- 제외 목록 파일이 손상됐거나 후보 번호 목록을 읽을 수 없으면 아무 URL도 저장하지 않고 오류를 답한다.

## 유지할 규칙

- 축제 `normalized_name`은 기존 공통 규칙만 사용한다.
- 신규 등록과 기존 업데이트 흐름에 자동으로 데이터를 넣지 않는다.
- 자동 삭제·승인·병합을 하지 않는다.
- `.env.local`을 읽거나 수정하지 않는다.
- 기존 Discord Bot DPAPI 인증을 유지하고 평문 인증 파일을 만들지 않는다.
- 웹훅 URL과 인증값을 로그·JSON·Discord에 출력하지 않는다.
- 외부 `festival-web-work`와 바탕화면 실행 폴더를 코드 원본으로 사용하지 않는다.
- 제외 목록은 `source_url`, 제외 명령 시각, 번호만 저장하며 제목 유사도 규칙을 추가하지 않는다.

## 검증 항목

- 세 사이트 최신 JSON을 정확히 선택한다.
- 기존 importer가 잘못된 도메인, 빈 제목, 과거 일정, 비축제 상품을 제외한다.
- 동일 URL은 등록됨, 제목·별칭·날짜 유사는 확인 필요, 참조 없음은 누락 후보가 된다.
- DB 실패 시 잘못된 누락 명단을 보내지 않는다.
- Discord 메시지가 제한 길이 안에서 분할되고 모든 후보 링크를 포함한다.
- 제외하지 않은 검토 대상은 실행할 때마다 다시 전송한다.
- 동일 URL은 실행이 달라도 같은 `T-NNN` 번호를 유지한다.
- 쉼표로 여러 번호를 입력하면 모두 처리하고 잘못된 번호를 분리해 안내한다.
- 제외된 정확한 URL은 다시 보고하지 않지만 새로운 2차·3차 티켓 URL은 새 번호로 보고한다.
- 비밀정보가 출력 파일과 로그에 포함되지 않는다.
- 자동 브라우저와 예약 작업 관련 실행 코드가 남지 않는다.
- `npm test`, 변경 파일 ESLint, `npm run typecheck`, `npm run build`를 검증한다.

## 완료 조건

- 세 북마클릿 실행 후 CMD 하나로 전체 과정이 완료된다.
- 운영 DB 비교 결과 JSON이 생성된다.
- Discord에서 누락 후보와 확인 필요 명단을 확인할 수 있다.
- Discord에서 `!티켓제외 T-001, T-002`로 여러 URL을 제외할 수 있다.
- 제외 명령을 적용한 URL만 이후 명단에서 빠진다.
- 자동 브라우저 접근 없이 동작한다.
- 관련 테스트와 문서가 실제 구조와 일치한다.

## 제외 범위

- 티켓 사이트 자동 방문·Headless Chrome·Puppeteer
- Windows 작업 스케줄러
- 티켓 상세 페이지 수집
- Instagram 자동 검색
- 홈페이지 검토 페이지 및 `festival_candidates` 자동 등록
- DB migration과 새 테이블·RPC
- 로그인, CAPTCHA, 접근 제한 우회

## 후속 개선점·참고사항

- 사이트에서 허용하는 공식 API·공개 피드가 확인되면 자동 수집을 별도 계획으로 검토한다.
- Instagram 검색과 홈페이지 등록 연결은 보고 품질이 안정된 뒤 별도 승인 대상으로 남긴다.
- 과거 외부 실행 폴더의 시작 바로가기는 오래된 Supabase DPAPI 경로를 사용해 재시작에 실패했다. 현재는 원본 `scripts/run-bot.ps1`로 실행했으며, 외부 바로가기를 현재 실행 방식으로 교체하는 작업은 별도 운영 정리 대상으로 남긴다.

## 실제 결과

- NOL 27개, Ticketlink 13개, YES24 14개를 수동 북마클릿 JSON에서 정리했다.
- DB 비교 후 Discord 후보 명단 전송을 확인했다.
- `✅ [확인 필요]`, `🆕 [누락 후보]`와 URL별 고정 `T-NNN` 번호를 적용했다.
- `!티켓제외 T-003, T-004, T-006, T-007, T-008, T-009` 명령으로 6개 URL을 한 번에 제외했다.
- 다음 CMD 실행 결과에서 제외한 6개 번호가 모두 사라진 것을 JSON으로 확인했다.
- 루트 자동 테스트 125개, Discord Bot 테스트 12개, 변경 파일 ESLint, 전체 타입 검사를 통과했다.
- Next.js 빌드는 컴파일과 타입 검사까지 통과했으나 작업 권한상 `.env.local`을 읽을 수 없어 최종 prerender는 검증하지 못했다.
