# 페스티봄 보안·감시·백업 연결 구조

> 기준일: 2026-08-12  
> 목적: 오늘 구축한 보호 장치가 무엇을 검사하고, 문제가 생겼을 때 어디로 이어지는지 한 문서에서 확인한다.

## 1. 전체 흐름

```text
코드 변경 → GitHub 저장 → GitHub Actions 품질·보안 검사
                         └→ Vercel 자동 배포 → 공개 URL·보안 헤더 점검
                                              └→ UptimeRobot 5분 간격 외부 감시

Supabase 운영 데이터 → DB 백업 21:00 → Storage 백업 21:30
                                      └→ Google Drive 복사 22:10
                                      └→ 보관 정리 일요일 22:30
                                      └→ 통합 상태 검사·Windows 알림 22:40

사용자 문의·삭제 요청 → 운영 요청 대장 → 매일 20:30 미처리 요청 알림
```

이 구조는 한 도구가 모든 문제를 막는 방식이 아니다. 코드 오류, 배포 오류, 외부 장애, 데이터 손실을 서로 다른 장치가 나누어 확인한다.

## 2. 보호 장치별 역할

| 영역 | 도구·작업 | 현재 역할 | 실패를 확인하는 곳 |
| --- | --- | --- | --- |
| 코드 품질 | GitHub Actions `Quality gate` | `main` push와 PR마다 테스트·타입 검사·Lint·빌드 실행 | GitHub Actions |
| 의존성 보안 | GitHub Actions `Security audit` | 매주 월요일 09:00 KST 및 수동 실행, 운영 의존성의 high 이상 취약점 검사 | GitHub Actions |
| 자동 배포 | Vercel | `main` push 감지 후 Production 빌드·배포 | Vercel Deployments |
| 배포 검증 | `Test-FestibomPublicDeployment.ps1` | 주요 URL, 잘못된 ID의 404, Cron 무인증 401, 보안 헤더 검사 | 로컬 실행 결과·JSON 보고서 |
| 외부 가용성 | UptimeRobot | `https://festibom.com`을 5분마다 외부에서 확인 | UptimeRobot 이메일 알림 |
| DB 보안 | Supabase RLS·GRANT·MFA·보안 마이그레이션 | 사용자별 데이터 격리, 일반 사용자의 관리자 접근 차단, 관리자 AAL2 적용 | Supabase Advisor·수동 SQL 감사 |
| Storage 보안 | 버킷 정책·MIME·크기 제한 | 허용된 이미지 형식과 경로만 쓰도록 제한, SVG 차단 | Supabase 정책·업로드 테스트 |
| 모바일 알림 서버 | Supabase Cron·Vault·Edge Function | 매분 알림 대상을 조회하고 Function 호출, Secret으로 호출 인증 | `cron.job_run_details`, HTTP 응답 기록 |
| DB 백업 | Windows 작업 `Festibom Supabase DB Backup` | 매일 21:00 roles·schema·data·manifest 생성 및 SHA-256 검증 | 운영 alerts JSON·예약 작업 결과 |
| Storage 백업 | Windows 작업 `Festibom Supabase Storage Backup` | 매일 21:30 전체 버킷 객체와 manifest 백업 및 SHA-256 검증 | 운영 alerts JSON·예약 작업 결과 |
| 외부 백업 | Windows 작업 `Festibom Google Drive Backup` | 매일 22:10 DB·Storage ZIP과 manifest를 Google Drive에 복사 | Drive 파일·예약 작업 결과 |
| 보관 정책 | Windows 작업 `Festibom Backup Retention` | 일요일 22:30, 30일 보관·종류별 최소 7개 유지 | 예약 작업 결과·retention 기록 |
| 백업 통합 알림 | Windows 작업 `Festibom Backup Alert Check` | 매일 22:40 DB·Storage·Drive 결과와 26시간 이상 미갱신 여부 검사 | Windows 팝업·alerts JSON |
| 사용자 요청 | Windows 작업 `Festibom User Request Check` | 매일 20:30 문의·삭제 요청 대장의 미처리·기한 초과 확인 | Windows 팝업·요청 대장 |
| 복구 검증 | DB 격리 복구·Storage 표본 복구 시험 | 운영 환경에 쓰지 않고 백업이 실제 복구 가능한지 확인 | `restore-tests` 보고서 |

## 3. 오늘 완료한 보안 작업

### Supabase

- 일반 사용자(`anon`)의 관리자 테이블 쓰기 권한 제거
- 내부 테이블의 불필요한 Data API 권한 제거
- 함수 `search_path` 고정과 `pg_trgm` 확장 스키마 분리
- Storage 버킷의 MIME·용량 제한 강화 및 SVG 업로드 차단
- 관리자 1명, TOTP MFA와 `aal2` 기반 관리자 접근 유지
- 모바일 알림 Cron → Vault Secret → Edge Function 연결 확인
- Cron 실행 `succeeded`, Function 응답 `200` 확인

### GitHub·Vercel

- `Quality gate`: 코드 변경 시 자동 품질 검사
- `Security audit`: 매주 의존성 취약점 자동 검사
- Vercel 보안 헤더 적용 및 공개 배포 검사 통과
- Cron API가 Secret 없이 호출되면 `401`을 반환하는지 검사

### 감시·백업

- UptimeRobot 5분 간격 감시와 이메일 알림 확인
- DB·Storage 로컬 백업, Google Drive 외부 복사 자동화
- DB 전체 격리 복구와 Storage 표본 복구 시험 성공
- 백업 상태 통합 검사와 Windows 실패 알림 자동화

## 4. 문제가 발생했을 때 확인 순서

### 사이트가 열리지 않을 때

1. UptimeRobot 알림 시각과 지속 시간을 확인한다.
2. Vercel Deployments에서 최신 배포 상태와 Runtime Log를 확인한다.
3. Supabase Status와 프로젝트 상태를 확인한다.
4. `Test-FestibomPublicDeployment.ps1`을 실행한다.
5. 최근 배포가 원인이면 이전 정상 Vercel 배포로 롤백한다.

### 저장·로그인만 실패할 때

1. Vercel Runtime Log와 브라우저 오류를 확인한다.
2. Supabase Auth·Database 로그와 RLS 정책을 확인한다.
3. 최근 migration과 환경변수 변경을 확인한다.
4. 다른 사용자의 데이터가 보이는 문제라면 즉시 관련 기능을 중지하고 보안 사고로 기록한다.

### 백업 알림이 뜰 때

1. Windows 예약 작업의 `LastTaskResult`를 확인한다.
2. `Documents\FestibomOperations\alerts`의 최신 실패 JSON을 확인한다.
3. Docker Desktop, 인터넷, Supabase 연결, Google Drive 실행 상태를 확인한다.
4. 실패 작업을 수동 재실행하고 SHA-256 검증 성공을 확인한다.

## 5. 현재 남은 보안·감시 작업

- Sentry 등 애플리케이션 내부 오류 수집 연결: 사이트가 열려도 저장·로그인·API가 실패하는 문제 감지
- CSP Report-Only 결과를 충분히 관찰한 뒤 강제 CSP 전환 검토
- 실제 Android 앱 완성 후 모바일 푸시 알림 end-to-end 검증
- 운영 PC가 꺼져 있어도 백업 가능한 상시 실행 환경 검토
- 월 1회 DB 격리 복구와 Storage 표본 복구 반복

## 6. 중요한 한계

- GitHub Actions 성공은 코드 검사가 통과했다는 뜻이며 실제 사용자 기능 전체를 보장하지 않는다.
- Vercel 자동 배포는 GitHub Actions의 성공을 기다리지 않고 시작될 수 있으므로 운영 규모가 커지면 PR 보호 규칙을 적용한다.
- UptimeRobot은 홈페이지가 응답하는지만 감지한다. 저장 실패나 화면 내부 오류는 Sentry 연결 전까지 별도 감지가 어렵다.
- 로컬 예약 백업은 운영 PC가 켜져 있고 필요한 프로그램이 실행 가능한 상태여야 한다.
- 백업 파일이 존재하는 것과 복구 가능한 것은 다르므로 복구 시험을 계속해야 한다.

