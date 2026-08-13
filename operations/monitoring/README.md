# 페스티봄 감시 체계

## 현재 연결된 감시

### UptimeRobot

- 대상: `https://festibom.com`
- 주기: 5분
- 알림: 등록된 이메일
- 감지 범위: 외부에서 사이트가 응답하지 않는 장애

### Vercel·공개 배포 점검

- Vercel이 `main` push를 감지해 자동 배포한다.
- 배포 뒤 `operations/deployment/Test-FestibomPublicDeployment.ps1`로 주요 URL, 404, Cron 401, 보안 헤더를 검사한다.
- 감지 범위: 배포 실패, Runtime 오류, 공개 경로와 보안 헤더 이상

### GitHub Actions

- `Quality gate`: push와 PR마다 코드 품질 검사
- `Security audit`: 매주 월요일 09:00 KST에 웹·모바일·Instagram 운영 봇의 운영 의존성 취약점 검사
- 감지 범위: 코드 검사 실패와 알려진 high 이상 취약점

### 백업 감시

- DB·Storage·Google Drive 백업은 각각 성공·실패 JSON을 `Documents\FestibomOperations\alerts`에 기록한다.
- 매일 22:40 `Festibom Backup Alert Check`가 작업 결과와 26시간 이상 미갱신을 검사한다.
- 문제 발생 시 Windows 팝업을 표시하고 같은 문제는 24시간에 한 번만 반복한다.

### Sentry

- 브라우저·서버·API 내부 코드 오류를 수집하는 코드 구성이 완료됐다.
- 사용자 정보, 쿠키, 헤더, URL 쿼리, 입력값과 일기 내용은 전송 전에 제거한다.
- 화면 녹화와 성능 추적은 사용하지 않는다.
- Sentry 프로젝트 생성과 Vercel 환경변수 등록 뒤 실제 수집이 시작된다.
- 연결 절차: `operations/monitoring/SENTRY_SETUP.md`

## 아직 연결되지 않은 감시

Sentry 코드 구성은 완료됐지만 DSN이 없으면 비활성화된다. 운영 계정의 Sentry 프로젝트와 Vercel 환경변수를 연결하고 첫 테스트 오류를 확인해야 한다.

## 장애 확인 순서

1. UptimeRobot 장애 알림 확인
2. Vercel 최신 배포와 Runtime Log 확인
3. Supabase 프로젝트 상태와 로그 확인
4. 공개 배포 점검 스크립트 실행
5. 최근 변경이 원인이면 롤백 후 핵심 기능 재검증

전체 관계와 한계는 `operations/SECURITY_MONITORING_AND_RECOVERY.md`를 참고한다.
