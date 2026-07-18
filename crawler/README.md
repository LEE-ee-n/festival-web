# 축제 제목 수집기

티켓 사이트의 목록에서 축제 제목과 상세 URL만 수집하는 1차 골격이다.

현재는 실제 사이트에 접속하지 않고 `sample-html/`만 사용한다. `.env`, Supabase,
운영 DB에는 접근하지 않는다.

## 실행

```cmd
npm run crawler:sample
npm run bookmarklet:nol
npm run crawler:import:nol -- --input="C:\\경로\\nol-tickets.json"
npm run crawler:import:nol -- --latest
npm test
```

결과는 `crawler-output/discovery.json`에 생성되며 Git에는 포함되지 않는다.

## 구조

- `core/runDiscovery.ts`: 어댑터 실행, 도메인 제한, 요청 간격, 타임아웃, 결과 저장
- `core/candidateFilter.ts`: URL 검사, 최대 개수, 중복 제거, 정렬
- `sources/types.ts`: 실제 티켓 사이트 수집기가 따라야 할 인터페이스
- `sources/exampleSource.ts`: 로컬 샘플 HTML용 예시 수집기
- `cli.ts`: 샘플 실행 명령 진입점
- `importers/nolManualImport.ts`: 사용자가 복사한 놀티켓 상품에서 콘서트 큰 제목만 정리
- `importManualCli.ts`: 놀티켓 수동 JSON을 `crawler-output/nol-discovery.json`으로 변환
- `crawler/tools/discovery-nol.cmd`: NOL 다운로드를 `festival-crwaler/crawl`로 옮기고 정리 결과를 `discovery`에 저장
- `crawler/tools/discovery-ticketlink.cmd`: 티켓링크 다운로드를 같은 수집·정리 폴더 규칙으로 처리
- `crawler/tools/discovery-yes24.cmd`: YES24 다운로드를 같은 수집·정리 폴더 규칙으로 처리
- `festival-crwaler/discord-webhook-url.txt`: Git 밖에서 보관하는 Discord 웹훅 URL 한 줄
- `bookmarklet/`: NOL·티켓링크·YES24의 현재 목록 화면을 JSON으로 다운로드하는 북마클릿과 설치 파일 생성

YES24는 콘서트 전체보기에서도 동작하지만, 페스티벌 탭에서 실행하면 불필요한 상품이 줄어든다. 상세 페이지를 자동으로 열지 않고 현재 화면의 상품만 읽는다.

## 아직 구현하지 않은 범위

- 실제 티켓 사이트 어댑터
- 페이지네이션과 재시도
- 상세 페이지 내용 수집
- `festival_candidates` 저장과 관리자 검토 화면 연결

실제 어댑터를 추가할 때는 해당 사이트의 이용약관과 `robots.txt`를 먼저 확인하고,
로그인·CAPTCHA·접근 제한을 우회하지 않는다.
