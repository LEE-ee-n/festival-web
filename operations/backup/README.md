# Festibom 수동 DB 백업

Supabase Free 플랜은 자동 프로젝트 백업을 제공하지 않는다. 이 도구는 연결된 운영 프로젝트의 `public` 스키마 구조와 데이터를 날짜별 폴더에 백업한다.

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

백업 폴더는 Git 저장소 밖을 사용한다. 예시는 `C:\FestibomBackups`다.

```cmd
cd /d "C:\Users\소닉스\Documents\festibom"
operations\backup\run-supabase-db-backup.cmd "C:\FestibomBackups"
```

성공하면 `C:\FestibomBackups\festibom-YYYYMMDD-HHMMSS` 폴더에 아래 파일이 생성된다.

- `schema.sql`: `public` 스키마 구조
- `data.sql`: `public` 테이블 데이터
- `manifest.json`: 생성 시각, 범위, 파일 크기와 SHA-256

## 운영 주기

- 매주 1회 실행한다.
- 운영 DB migration 적용 전에는 반드시 새 백업을 만든다.
- 최근 4주 폴더를 유지하고, 생성 직후 Drive 또는 외장 디스크에 복사한다.

## 중요한 제외 범위

이 도구는 `public` 스키마만 백업한다. Supabase CLI 기본 덤프는 `auth`, `storage` 관리 스키마를 포함하지 않는다.

- 관리자 Auth 계정과 Supabase project secrets/settings은 별도 관리 대상이다.
- `festival-thumbnails`, `festival-candidate-posters`의 실제 이미지 파일은 DB 덤프에 포함되지 않는다.
- Storage 파일은 월 1회 별도로 내려받는다. 대량 파일은 Supabase Storage의 S3 호환 접근을 사용해 로컬에 동기화하는 후속 작업으로 처리한다.

## 복구 원칙

운영 DB에 바로 `schema.sql`이나 `data.sql`을 실행하지 않는다. 새 Supabase 프로젝트 또는 로컬 검증 환경에 먼저 복원해 데이터·이미지·로그인을 확인한 뒤, 운영 복구는 별도 승인으로 진행한다.
