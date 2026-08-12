# 페스티봄 운영 매뉴얼

> 2026-08-12 현재 운영 기준. 전체 연결 관계는 `operations/SECURITY_MONITORING_AND_RECOVERY.md`를 먼저 본다.

## 1. 현재 자동 실행 일정

| 시각 | 작업 | 성공 기준 |
| --- | --- | --- |
| 매일 20:30 | 사용자 요청 대장 검사 | 미처리·기한 초과 요청 확인 |
| 매일 21:00 | Supabase DB 백업 | `LastTaskResult = 0`, 필수 4파일과 SHA-256 정상 |
| 매일 21:30 | Supabase Storage 백업 | 전체 객체 수·용량·SHA-256 정상 |
| 매일 22:10 | Google Drive 외부 백업 | DB ZIP·Storage ZIP·manifest 생성 |
| 일요일 22:30 | 백업 보관 정리 | 30일 보관, 종류별 최소 7개 유지 |
| 매일 22:40 | 백업 통합 상태 검사 | DB·Storage·Drive 모두 정상, 26시간 이내 갱신 |
| 5분마다 | UptimeRobot | `https://festibom.com` 응답 정상 |
| 매주 월요일 09:00 | GitHub Security audit | high 이상 운영 의존성 취약점 없음 |
| 매분 | Supabase 모바일 알림 Cron | Cron `succeeded`, Function HTTP `200` |

## 2. 복구 목표

- RPO 24시간: 사고 시 최대 약 하루 동안의 변경 데이터가 손실될 수 있다.
- RTO 24시간: 큰 장애 발생 후 24시간 이내 복구 또는 임시 정상화를 목표로 한다.
- DB 격리 복구와 Storage 표본 복구 시험은 성공했다. 실제 운영 복구는 항상 격리 검증 후 진행한다.

## 3. 자동 감시가 알려주는 것

- UptimeRobot 이메일: 외부에서 홈페이지가 열리지 않음
- GitHub Actions: 코드 검사나 의존성 보안 검사 실패
- Vercel: 빌드·배포·Runtime 오류
- Windows 팝업: DB·Storage·Google Drive 백업 실패 또는 오래된 상태
- Windows 팝업: 사용자 요청 미처리 또는 기한 초과
- 아직 미구축: 사이트는 열리지만 저장·로그인·API 내부에서 발생하는 오류의 자동 수집(Sentry 예정)

## 4. 매일 직접 확인

- Windows 알림과 UptimeRobot 이메일을 확인한다.
- 축제·아티스트 정보는 공식 출처와 비교하며 가능한 만큼 갱신한다.
- 새 배포가 있었다면 홈페이지, Google 로그인, 관심 아티스트, 내 공연 일정, 페스티봄 일기 저장을 확인한다.
- 사용자 문의·삭제 요청이 왔다면 요청 대장에 등록한다.

## 5. 매주 직접 확인

- DB·Storage·Drive 백업이 7일 연속 생성됐는지 확인한다.
- GitHub Actions `Security audit`가 성공했는지 확인한다.
- Vercel 배포 실패, Supabase 오류와 사용량을 확인한다.
- UptimeRobot 장애 이력이 있었는지 확인한다.

## 6. 매월 직접 확인

- DB 격리 복구 1회, Storage 표본 복구 1회를 실행한다.
- GitHub, Vercel, Supabase, Google 계정의 2단계 인증과 복구 수단을 확인한다.
- Supabase Security Advisor와 권한 감사 SQL을 확인한다.
- 개인정보처리방침과 실제 수집·보관·삭제 흐름이 일치하는지 확인한다.
- 도메인·외부 서비스 비용·무료 한도를 확인한다.

## 7. 백업 실패 시

1. Windows 작업 스케줄러의 `LastTaskResult`를 확인한다.
2. `Documents\FestibomOperations\alerts`의 최신 실패 JSON을 확인한다.
3. Docker Desktop, 인터넷, Supabase 연결, Google Drive 실행 상태를 확인한다.
4. 원인을 고친 뒤 해당 작업을 수동 실행한다.
5. 새 백업의 manifest와 SHA-256 검증 성공을 확인한다.
6. 원인과 해결 내용을 운영 기록에 남긴다.

## 8. 아직 남은 작업

1. Sentry 내부 오류 수집 연결
2. Android 앱과 실제 모바일 푸시 알림 end-to-end 검증
3. CSP 강제 모드 전환 여부 검토
4. 운영 PC 장애에 대비한 백업 실행 환경 이중화
