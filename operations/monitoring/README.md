# 운영 상태와 알림

## 현재 1단계

DB 예약 백업은 실행할 때마다 Git 저장소 밖의 `Documents\FestibomOperations\alerts`에 다음 파일을 만든다.

- `latest-backup-status.json`: 가장 최근 실행 결과
- `backup-YYYYMMDD-HHMMSS-success.json`: 성공 이력
- `backup-YYYYMMDD-HHMMSS-failure.json`: 실패 이력

이 파일은 상태 기록이며 즉시 알림은 아니다. 사용자가 열어 보지 않으면 실패를 알 수 없다는 한계가 있다.

## 다음 2단계

우선순위는 다음과 같다.

1. 백업 실패 시 Windows 알림
2. Vercel 배포 실패 알림
3. 홈페이지와 로그인 상태 감시
4. 필요 시 이메일 또는 Discord 통합 알림

알림에는 개인정보, 비밀번호, access token, DB 접속 문자열을 넣지 않는다.
