# 페스티봄 현재 상태와 남은 작업

> 갱신일: 2026-08-13  
> 기준 커밋: `83882fe`  
> 원칙: 완료된 구축 작업과 실제 운영 확인이 필요한 작업을 구분한다.

## 현재 결론

웹 서비스의 기본 기능, 배포 검사, 보안 점검, 백업·복구 체계는 운영 가능한 수준이다. 지금 가장 중요한 것은 새 기능 개발보다 자동화가 실제 예약 시각에도 계속 성공하는지 확인하고, 오류 감시와 모바일 앱을 운영 계정에 연결하는 일이다.

## 완료된 작업

### 배포·코드 검사

- GitHub Actions `Quality gate` 성공
- GitHub Actions `Security audit` 성공 및 매주 월요일 09:00 KST 자동 실행
- 웹·모바일·Instagram 운영 봇의 운영 의존성을 한 번에 보안 검사
- 2026-08-13 세 프로젝트의 운영 의존성 취약점 0건 확인
- Vercel `main` 자동 배포 사용
- 공개 URL, 404, Cron 401, 보안 헤더 smoke test 성공
- UptimeRobot이 5분 간격으로 `https://festibom.com` 감시

### 인증·보안

- Google 로그인과 단일 관리자 MFA 적용
- 일반 회원의 관리자 경로 접근 차단
- 사용자별 개인 데이터 RLS 및 타 사용자 접근 차단
- 회원탈퇴와 재인증 흐름 구현
- Supabase 익명 쓰기 권한과 불필요한 함수 실행 권한 정리
- 모바일 알림 Cron이 HTTP 200으로 실행되는 것 확인

### 백업·복구

- 매일 21:00 DB 백업
- 매일 21:30 Storage 백업
- 매일 22:10 Google Drive 외부 백업
- 일요일 22:30 보관 정책 실행
- 매일 22:40 백업 통합 상태 검사
- DB 필수 4파일과 SHA-256 검증 성공
- Storage 전체 객체 SHA-256 검증 성공
- 격리 DB 복원과 Storage 표본 복원 성공
- 사용자 요청 대장과 매일 20:30 미처리 요청 검사 구축

## 진행 중

### Sentry 내부 오류 감시

코드 구성은 완료됐다. 사용자 정보, 쿠키, 헤더, URL 쿼리, 입력값과 일기 내용은 제거하고 화면 녹화·성능 추적은 사용하지 않는다.

집에서 할 일:

1. Sentry에 Next.js 프로젝트 `festibom-web` 생성
2. Vercel Production에 `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` 등록
3. 재배포 후 개인정보가 없는 테스트 오류 1건 수신 확인

상세 절차: `operations/monitoring/SENTRY_SETUP.md`

## 다음 우선순위

### P0. 실제 야간 자동 실행 확인

수동 실행 성공과 예약 실행 성공은 다르다. PC, Docker Desktop, Google Drive가 켜진 날 다음 날 확인한다.

- DB·Storage·Drive 예약 작업 `LastTaskResult = 0`
- 최신 백업과 상태 JSON이 예약 시각 이후로 갱신됨
- Google Drive에 해당 날짜 ZIP 2개와 manifest가 있음
- 백업 통합 상태 검사 정상

2026-08-12 예약 실행 기록에서 요청 검사, DB, Storage, Drive, 통합 상태 검사가 모두 성공했다. 따라서 일요일 보관 정책의 첫 정기 실행 확인만 남았다.

### P1. 모바일 앱 실기기 연결

Play Console 또는 EAS/FCM 준비 후 진행한다.

- 개발 APK 생성
- 실제 Android 기기 로그인과 푸시 토큰 등록
- 알림 수신과 딥링크 이동
- 로그아웃 후 토큰 비활성화
- 오프라인 일정 이미지 확인

### P2. CSP 강제 적용 검토

현재 CSP는 Report-Only다. Sentry까지 연결한 뒤 7일 이상 위반을 관찰하고 Google 로그인, Supabase, GA4, Clarity, 이미지가 차단되지 않을 때만 강제 모드로 전환한다.

### P3. 개인 PC 의존성 축소

현재 백업은 운영 PC가 꺼지면 실행되지 않는다. 사용자와 데이터가 늘어나면 Supabase Pro 자동 백업 또는 항상 켜진 별도 실행 환경으로 옮긴다.

## 정기 운영

- 매일: UptimeRobot·백업 실패 알림·사용자 요청 확인
- 매주: GitHub Security audit·7일 백업 연속성·핵심 기능 표본 확인
- 매월: DB 격리 복원·Storage 표본 복원·계정 MFA·무료 한도 확인

체크리스트는 `operations/checklists`를 사용한다.
