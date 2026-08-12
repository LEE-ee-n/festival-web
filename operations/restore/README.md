# Festibom DB 격리 복구 시험

운영 DB에 SQL을 실행하지 않는다. 이 도구는 가장 최근 백업을 별도의 로컬 Supabase 스택에 복원하고 핵심 행 수만 확인한다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\operations\restore\Test-FestibomDbRestore.ps1
```

시험 환경과 보고서는 `Documents\FestibomOperations\restore-tests`에 남는다. 이메일과 일기 내용은 출력하지 않는다.

성공 기준:

- `roles.sql`, `schema.sql`, `data.sql`이 오류 없이 적용됨
- Auth 사용자, 축제, 아티스트가 1건 이상 복원됨
- 관심 아티스트, 내 공연 일정, 페스티봄 일기, Storage 메타데이터 개수가 출력됨
- 운영 DB에는 쓰기 작업이 발생하지 않음

복구 시험 이후 실제 서비스 복구에는 Google OAuth 설정, API 키, Supabase 프로젝트 설정과 실제 Storage 파일을 별도로 복원해야 한다.
