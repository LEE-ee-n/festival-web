# Festibom 수동 DB 백업

Supabase Free 플랜은 자동 프로젝트 백업을 제공하지 않는다. 이 도구는 연결된 운영 프로젝트의 역할, 데이터베이스 구조와 데이터(Auth 사용자 및 Storage 메타데이터 포함)를 날짜별 폴더에 백업한다.

## 최초 1회 준비

Docker Desktop을 실행한 뒤 프로젝트 루트에서 다음 명령을 실행한다. Supabase CLI의 DB 덤프는 `pg_dump` 컨테이너를 사용한다. 토큰과 DB 비밀번호는 본인 화면에만 입력하며, `.env`·스크립트·Git에 저장하지 않는다.

```cmd
cd /d "C:\Users\소닉스\Documents\festibom"
npx supabase login
npx supabase link --project-ref cljzrgjatdnefiogedmz
```

`supabase login`의 personal access token은 Supabase Dashboard의 Account > Access Tokens에서 직접 만든다. `supabase link`는 운영 DB 비밀번호를 물으면 본인만 입력한다.

백업 도구는 실행할 때 임시 Supabase 작업 폴더를 사용하므로 프로젝트 루트의 기존 `.env` 파일을 읽지 않는다.

## 백업 실행

백업 폴더는 Git 저장소 밖의 Festibom 운영 전용 폴더를 사용한다.

```cmd
cd /d "C:\Users\소닉스\Documents\festibom"
operations\backup\run-supabase-db-backup.cmd "%USERPROFILE%\Documents\FestibomOperations\backups\db"
```

성공하면 `Documents\FestibomOperations\backups\db\festibom-YYYYMMDD-HHMMSS` 폴더에 아래 파일이 생성된다.

- `roles.sql`: 데이터베이스 역할
- `schema.sql`: 데이터베이스 구조
- `data.sql`: 데이터베이스 데이터(Auth 사용자 및 Storage 메타데이터 포함)
- `manifest.json`: 생성 시각, 범위, 파일 크기와 SHA-256

## 운영 주기

- Windows 작업 스케줄러가 매일 21:00에 실행한다.
- 예약 시각을 놓치면 다음 로그인 또는 절전 해제 뒤 가능한 즉시 실행한다.
- 운영 DB migration 적용 전에는 반드시 새 백업을 만든다.
- 오래된 백업은 자동 삭제하지 않고 정기적으로 삭제 후보를 검토한다.
- 현재는 로컬에 보관한다. 다음 단계에서 Drive 또는 외장 디스크 복사를 추가한다.

## 중요한 제외 범위

이 도구는 Supabase 공식 CLI 백업 절차처럼 역할·전체 구조·전체 데이터를 각각 덤프한다. 사용자 계정을 참조하는 개인 일정과 페스티봄 일기를 복구하려면 Auth 사용자 데이터가 반드시 함께 있어야 한다.

- Google OAuth 설정, API 키와 Supabase project secrets/settings는 별도 관리 대상이다.
- `festival-thumbnails`, `festival-candidate-posters`의 실제 이미지 파일은 DB 덤프에 포함되지 않는다. Storage 메타데이터만 포함된다.
- Storage 파일은 별도로 내려받아 `Documents\FestibomOperations\backups\storage`에 저장한다. 대량 파일은 Supabase Storage의 S3 호환 접근을 사용해 로컬에 동기화하는 후속 작업으로 처리한다.
- S3 access key는 모든 버킷에 접근하고 RLS를 우회할 수 있으므로 Git, 문서, `.env`에 기록하지 않고 운영자 비밀번호 관리자에만 보관한다.

## 복구 원칙

운영 DB에 바로 `schema.sql`이나 `data.sql`을 실행하지 않는다. 새 Supabase 프로젝트 또는 로컬 검증 환경에 먼저 복원해 데이터·이미지·로그인을 확인한 뒤, 운영 복구는 별도 승인으로 진행한다.

## Windows 작업 스케줄러 자동 실행

기본 일정은 매일 21:00이며, 예약 시각에 컴퓨터를 사용하지 못했으면 다음 로그인 또는 절전 해제 뒤 가능한 즉시 실행한다. 같은 작업이 이미 실행 중이면 중복 실행하지 않는다. Docker Desktop이 꺼져 있으면 자동으로 시작하고 최대 3분간 준비를 기다린다.

현재 Windows 사용자로 작업을 등록한다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\소닉스\Documents\festibom\operations\backup\install-windows-scheduled-task.ps1"
```

다른 시각을 사용하려면 24시간제 `HH:mm` 값을 전달한다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\소닉스\Documents\festibom\operations\backup\install-windows-scheduled-task.ps1" -DailyAt "23:30"
```

등록 직후 실제 예약 작업을 실행하고 결과를 확인한다.

```powershell
Start-ScheduledTask -TaskName "Festibom Supabase DB Backup"
Get-ScheduledTaskInfo -TaskName "Festibom Supabase DB Backup"
```

성공 조건은 `LastTaskResult`가 `0`이고, `Documents\FestibomOperations\backups\db`에 새 `festibom-*` 폴더와 `schema.sql`, `data.sql`, `manifest.json`이 생성되는 것이다. 실행 로그는 DB 백업 폴더의 `logs`에 저장된다. 가장 최근 성공·실패 상태와 이력은 `Documents\FestibomOperations\alerts`에 JSON으로 기록된다.

폴더에 실패 기록이 생성되는 것은 알림의 1단계다. 운영자가 즉시 알아차리도록 하는 Windows 알림 또는 이메일·Discord 알림은 후속 단계에서 연결한다.

작업을 더 이상 사용하지 않을 때만 다음 명령으로 해제한다.

```powershell
Unregister-ScheduledTask -TaskName "Festibom Supabase DB Backup" -Confirm:$false
```

컴퓨터가 완전히 꺼져 있으면 실행할 수 없다. 또한 현재 설정은 로그인된 사용자 세션에서 동작하므로, Windows 로그인 후 Docker Desktop을 실행할 수 있는 상태여야 한다.

## 백업 상태 자동 점검

다음 명령은 최신 백업이 26시간 이내인지, 필수 파일과 SHA-256이 정상인지, 디스크 여유 공간이 충분한지 확인한다. 35일이 지난 백업은 자동 삭제하지 않고 정리 대상으로만 보고한다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\operations\backup\Test-FestibomDbBackup.ps1
```

결과는 `Documents\FestibomOperations\alerts\latest-backup-health.json`에 저장된다. `status`가 `failure`이면 일간 점검을 정상 완료로 처리하지 않는다.
