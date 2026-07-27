# Discord Bot 실행 로그 추가

## 목적과 완료 조건

- 봇의 시작·Discord 연결·메시지 처리·오류·종료 원인을 파일로 확인할 수 있게 한다.
- CMD 화면에도 기존처럼 같은 로그가 보이게 한다.
- 토큰, 비밀번호, Supabase 키와 메시지 전체 내용은 기록하지 않는다.

## 범위

- `operations/discord-instagram-bot/src/bot.js`
- `operations/discord-instagram-bot/scripts/run-bot.ps1`
- 봇 기능, DB 처리 방식, 권한은 변경하지 않는다.

## 작업 순서

1. [완료] 봇 코드에 시각이 포함된 정보·오류 로그를 추가한다.
2. [완료] Discord 연결·해제와 메시지 처리 성공·실패를 기록한다.
3. [완료] PowerShell 실행기의 표준 출력·오류를 `work/logs` 일자별 파일에 함께 저장한다.
4. [완료] Bot 테스트와 JavaScript 문법 검사를 실행한다.

## 위험과 검증

- 로그에 비밀값과 메시지 본문이 포함되지 않는지 확인한다.
- CMD 표시와 로그 파일 저장이 동시에 동작해야 한다.
- 봇 종료 코드가 로그에 남아야 한다.

## 검증 결과

- `node --check src/bot.js` 통과.
- 변경 파일 ESLint 통과.
- PowerShell 실행 스크립트 문법 검사 통과.
- Bot의 표준 오류 출력이 PowerShell 실행기를 중단하던 문제를 수정했다. 오류와 이후 정상 출력을 연속으로 수집하는 검증을 통과했다.
- Bot 테스트 13개 중 12개 통과. 나머지 1개는 읽기 전용 실행 환경에서 테스트 임시 폴더를 만들 수 없어 실패했다.
