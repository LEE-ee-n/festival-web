# [구현·최초 백업 검증 완료] Supabase Free 플랜 수동 백업 체계 계획

## 목적과 완료 조건

- Supabase Free 플랜에서 운영자가 필요할 때 한 번의 명령으로 공개 서비스 데이터의 날짜별 DB 백업을 만들 수 있다.
- 백업 결과물은 Git 저장소 밖의 사용자가 지정한 폴더에만 생성되며, Git·Vercel·소스 코드에 비밀값이나 백업 파일을 저장하지 않는다.
- DB 데이터와 Storage 파일의 백업 범위·제외 범위·복구 순서를 문서화한다.
- 실제 첫 DB 백업을 사용자가 직접 실행해 결과 파일과 종료 상태를 확인한다.

## 확정 범위와 제외 범위

- 포함:
  - `public` 스키마의 구조 덤프와 데이터 덤프를 각각 생성하는 PowerShell 실행 도구
  - 날짜별 폴더, 결과 파일 목록·SHA-256 매니페스트, 실패 시 중단 처리
  - Supabase CLI 최초 연결 안내와 수동 실행·복구 절차 문서
  - `festival-thumbnails`, `festival-candidate-posters` Storage 파일의 별도 백업 필요성 및 S3 호환 도구 설정 안내
- 제외:
  - Windows 작업 스케줄러 자동 실행
  - DB·Storage 자동 복원 또는 운영 DB 덮어쓰기
  - 비밀번호·Supabase access token·S3 access key를 코드, Git, 환경 파일, 문서에 기록
  - Supabase Auth 사용자·비밀 설정·Edge Function 설정의 자동 백업

## 예상 수정 파일·데이터 흐름

- `operations/backup/run-supabase-db-backup.ps1`: `-Destination`으로 받은 Git 밖 폴더에 날짜별 `schema.sql`, `data.sql`, `manifest.json`을 생성한다.
- `operations/backup/README.md`: 최초 Supabase CLI 로그인·프로젝트 연결, 실행 명령, Storage 별도 백업, 복구 원칙을 설명한다.
- `.gitignore`: 백업 결과물이 실수로 Git에 추가되지 않도록 `backups/` 경로를 추가한다.
- `DATABASE.md`, `PROJECT_STATUS.md`: Free 플랜의 백업 범위·운영 주기와 검증 상태를 반영한다.
- 흐름: 운영자 실행 → Supabase CLI가 연결된 프로젝트의 `public` 구조와 데이터를 덤프 → 지정한 로컬 백업 폴더에 날짜별 저장 → 운영자가 Drive 등 별도 저장소에 복사.

## 작업 순서

1. [x] 사용자 입력을 검증하고 기존 폴더를 덮어쓰지 않는 DB 백업 PowerShell 도구를 만들었다.
2. [x] `supabase db dump --linked`로 구조 덤프와 `--data-only` 데이터 덤프를 분리 생성하고, 각 파일 해시·실행 시각을 매니페스트에 기록한다.
3. [x] Git 제외 규칙과 운영 문서를 추가했다.
4. [x] 사용자가 본인 CMD에서 Supabase CLI 로그인·프로젝트 연결 후 첫 백업을 실행했다. 비밀번호·토큰은 저장하거나 전달하지 않았다.
5. [x] `C:\FestibomBackups`의 백업 4개와 최신 백업의 `schema.sql`, `data.sql`, `manifest.json` 존재를 확인하고 SHA-256 해시 일치를 검증했다.

## 운영 규칙

- 주기: 매주 1회, 그리고 운영 DB migration 적용 전 반드시 1회.
- 보관: 최근 4주 DB 백업을 유지하고, 최소 한 사본은 Drive·외장 디스크 등 PC 밖 저장소에 보관한다.
- Storage: DB 덤프는 Storage 객체 파일을 포함하지 않는다. `festival-thumbnails`와 `festival-candidate-posters`는 월 1회 S3 호환 도구로 별도 내려받는다.
- 복구: 운영 DB에 바로 실행하지 않는다. 새 Supabase 프로젝트 또는 로컬 검증 환경에서 먼저 구조·데이터·이미지를 확인한 뒤 별도 승인으로 복구한다.

## 회귀 위험과 검증 방법

- 잘못된 프로젝트 연결 또는 출력 폴더를 방지하기 위해 실행 전 프로젝트·대상 폴더를 표시하고, 기존 폴더가 있으면 중단한다.
- CLI 기본 덤프는 데이터가 빠질 수 있으므로 구조·데이터 파일을 분리해 존재와 크기를 확인한다.
- Supabase CLI 덤프는 `pg_dump` 컨테이너를 사용하므로 사용자의 Docker Desktop 실행 상태를 최초 실행 전에 확인한다.
- `auth`, `storage` 관리 스키마와 Storage 객체 파일은 이 DB 도구 범위에서 제외됨을 문서에 명시한다.
- PowerShell 구문 검사와 실제 사용자의 최초 실행 결과를 확인한다.

## 후속 개선점

- 첫 백업 검증 후 Storage S3 access key를 사용자 로컬 자격증명 저장소에만 등록하는 rclone 동기화 명령을 별도 계획으로 추가한다.

## 실제 확인 결과

- 2026-08-02에 생성된 백업 폴더 4개가 `C:\FestibomBackups`에 존재한다.
- 최신 확인 백업 `festibom-20260802-163347`에는 public schema 187,981바이트와 public data 2,014,080바이트가 있다.
- 두 SQL 파일의 현재 SHA-256이 `manifest.json` 기록과 일치해 생성 후 변조·손상 흔적이 없다.
- 이 백업은 Auth, Storage 메타데이터·객체 파일과 Supabase 설정·비밀키를 포함하지 않는다.
- 격리 환경 복구 시험과 최신 주간 백업 생성은 남아 있다.
- 운영량·복구 요구가 늘어나면 Supabase Pro의 자동 일일 백업 또는 PITR을 다시 검토한다.
