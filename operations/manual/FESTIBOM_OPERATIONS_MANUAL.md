# 페스티봄 운영 매뉴얼

> 2026-08-12 1차 운영 기준. 실제 운영을 하며 수정한다.

## 1. 현재 확정한 운영 기준

| 항목 | 현재 기준 |
| --- | --- |
| DB 백업 | 매일 21:00 자동 실행 |
| 백업 위치 | `Documents\FestibomOperations\backups\db` |
| 백업 상태 기록 | `Documents\FestibomOperations\alerts` |
| Storage 백업 | 필요. 자동화는 다음 단계에서 구현 |
| 외부 백업 | 현재는 로컬만 사용. 추후 Drive 또는 외장 저장소 추가 |
| 사용자 요청 | `Documents\FestibomOperations\requests`에서 관리 |
| 축제·아티스트 관리 | 매일 가능한 만큼 직접 진행 |
| 기타 점검 | 가능한 부분은 자동화하고 판단이 필요한 작업만 직접 처리 |

## 2. 복구 목표

- 잠정 RPO: 24시간
  - 매일 21시에 백업하므로 사고 시 최악의 경우 약 24시간 동안 입력된 데이터가 사라질 수 있다는 의미다.
- 잠정 RTO: 24시간
  - 큰 장애가 발생하면 24시간 안에 복구 또는 임시 정상화하는 것을 목표로 한다.
- 위 수치는 실제 격리 복구 시험에 걸린 시간을 확인한 뒤 다시 정한다.

## 3. 매일 확인

- `alerts\latest-backup-status.json`의 상태가 `success`인지 확인한다.
- `operations\backup\Test-FestibomDbBackup.ps1`을 실행하고 `latest-backup-health.json`의 상태가 `success`인지 확인한다.
- 홈페이지 첫 화면과 Google 로그인이 정상인지 확인한다.
- 최근 배포 후에는 관심 아티스트, 내 공연 일정, 페스티봄 일기 저장을 확인한다.
- 축제·아티스트 정보는 공식 출처와 비교하며 가능한 만큼 갱신한다.

## 4. 매주 확인

- 최근 DB 백업 폴더에 `roles.sql`, `schema.sql`, `data.sql`, `manifest.json`이 있는지 확인한다.
- 백업 파일 크기가 갑자기 0 또는 비정상적으로 작아지지 않았는지 확인한다.
- Vercel 배포 실패와 Supabase 오류·사용량을 확인한다.
- `requests` 폴더의 미처리 요청을 확인한다.

## 5. 매월 확인

- 최근 4주를 넘은 DB 백업의 삭제 후보를 검토한다.
- Storage 백업 완료 여부와 파일 수·용량을 확인한다.
- GitHub, Vercel, Supabase, Google 계정의 2단계 인증과 복구 수단을 확인한다.
- `npm audit`, 테스트, 타입 검사, ESLint를 실행한다.
- 개인정보처리방침과 실제 기능·외부 서비스가 일치하는지 확인한다.

## 6. 백업 실패 시

1. `alerts\latest-backup-status.json`의 `message`와 `log_path`를 확인한다.
2. Windows 작업 스케줄러의 `LastTaskResult`를 확인한다.
3. Docker Desktop, 인터넷 연결, Supabase link 상태를 확인한다.
4. 원인을 고친 뒤 작업을 수동 실행한다.
5. 새 백업의 manifest와 SHA-256 검증 성공을 확인한다.
6. 원인과 해결 내용을 운영 기록에 남긴다.

## 7. 아직 완료되지 않은 운영 작업

1. DB 백업을 새 Supabase 프로젝트 또는 로컬 환경에 실제 복원
2. Supabase Storage S3 연결과 로컬 동기화 자동화
3. 로컬 백업을 Drive 또는 외장 저장소에 이중 보관
4. 폴더 기록을 Windows·이메일·Discord 즉시 알림으로 연결
5. 배포·장애·데이터 관리의 세부 실행 체크리스트 작성
