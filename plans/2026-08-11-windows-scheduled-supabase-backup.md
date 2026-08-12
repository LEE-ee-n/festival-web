# [완료] 2026-08-11 Windows 작업 스케줄러 Supabase 백업 자동화

## 목적과 완료 조건

- 기존 Supabase Free 플랜 DB 백업 도구를 Windows 작업 스케줄러에서 매일 자동 실행한다.
- 컴퓨터가 예약 시각에 꺼져 있거나 절전 상태였으면 다음 사용 가능한 시점에 누락 실행한다.
- 작업 스케줄러에서 수동 실행한 뒤 새 백업 폴더, `schema.sql`, `data.sql`, `manifest.json` 생성과 SHA-256 일치를 확인한다.
- 작업의 마지막 실행 결과가 성공이고 실행 로그가 남는 것을 확인한다.

## 확정 범위와 제외 범위

- 포함:
  - 매일 21:00 실행하는 `Festibom Supabase DB Backup` 작업 등록
  - 동일 Windows 사용자로 실행하고, 사용자가 로그인한 상태에서 동작
  - Docker Desktop 미실행 시 기동 후 준비 상태 대기
  - 예약 시각 누락 시 가능한 즉시 실행, 중복 실행 방지
  - `C:\FestibomBackups`에 실행 로그 저장
  - 등록 직후 작업을 수동 실행해 실제 백업과 해시 검증
- 제외:
  - 백업 폴더 자동 삭제 및 보관기간 정리
  - Supabase Storage 객체, Auth 사용자, 프로젝트 비밀값 백업
  - 클라우드·외장 디스크 자동 복사
  - 컴퓨터가 꺼진 상태에서 원격 실행

## 예상 수정 파일과 흐름

- `operations/backup/run-scheduled-supabase-db-backup.ps1`
  - Docker 준비 확인 → 기존 백업 스크립트 실행 → 결과 및 해시 검증 → 로그 기록
- `operations/backup/install-windows-scheduled-task.ps1`
  - 절대경로 기반 작업 등록과 누락 실행·중복 방지 설정
- `operations/backup/README.md`
  - 등록, 즉시 시험, 상태 확인, 일정 변경, 작업 해제 방법
- `plans/2026-08-11-windows-scheduled-supabase-backup.md`, `PROJECT_STATUS.md`
  - 작업 진행 및 실제 검증 결과 기록

데이터 흐름:

`Windows 작업 스케줄러 → Docker 준비 → 기존 Supabase db dump → C:\FestibomBackups\festibom-* → manifest 해시 검증 → logs 기록`

## 작업 순서

1. [x] 예약 실행 전용 래퍼와 작업 등록 스크립트를 작성한다.
2. [x] PowerShell 구문 검사와 실패 처리 경로를 점검한다.
3. [x] 현재 Windows 사용자에 예약 작업을 등록한다.
4. [x] 예약 작업을 즉시 수동 실행한다.
5. [x] 작업 결과 코드, 최신 백업 파일, 크기, manifest SHA-256을 확인한다.
6. [x] 사용법과 실제 결과를 문서 및 프로젝트 상태에 반영하고 계획 제목을 `[완료]`로 변경한다.

## 실제 결과

- Windows 기본 `schtasks.exe` 기반 `Festibom Supabase DB Backup` 작업 등록과 즉시 실행 완료.
- 2026-08-11 23:13:12 예약 실행 시작, Docker 준비 확인 후 23:13:26 성공 종료.
- 생성 폴더: `C:\FestibomBackups\festibom-20260811-231315`
- `schema.sql`: 244,036바이트, manifest SHA-256 일치.
- `data.sql`: 2,838,917바이트, manifest SHA-256 일치.
- 실행 로그: `C:\FestibomBackups\logs\scheduled-20260811-231312.log`
- `festival_candidates`, `user_festival_diaries`, `user_festival_performances` 순환 외래키 경고가 있어 실제 복구 시 제약조건 처리 순서를 검증해야 한다. 백업 생성과 해시 검증에는 영향이 없었다.
- 최초 실패 시험에서 생성된 `festibom-20260811-231013`은 manifest가 없는 불완전 백업이며 자동 삭제하지 않고 삭제 후보로 남겼다.

## 회귀 위험과 검증 방법

- Docker 준비 실패: 제한 시간 내 Docker 엔진이 준비되지 않으면 백업을 중단하고 로그에 원인을 남긴다.
- Supabase 인증 만료·연결 해제: 기존 CLI 실패 코드를 그대로 실패 처리하고 불완전 백업을 성공으로 기록하지 않는다.
- 경로·한글 사용자명 문제: 모든 실행 파일과 인수를 절대경로 및 PowerShell 인수 배열로 전달한다.
- 중복 실행: 이전 작업이 실행 중이면 새 실행을 시작하지 않는다.
- 검증: 예약 작업 직접 실행 후 `LastTaskResult = 0`, 신규 파일 존재, 파일 크기 0 초과, manifest 해시 일치를 모두 확인한다.

## 후속 개선점

- 사용자가 필요성을 확인한 뒤 오래된 백업을 삭제 후보로 표시하는 별도 정리 절차를 계획한다.
- 실제 이용자와 수익이 생기면 Supabase Pro 자동 일일 백업으로 전환하고 로컬 백업을 보조 수단으로 축소한다.
- Storage 이미지 백업과 PC 외부 저장소 복사는 별도 계획으로 다룬다.
