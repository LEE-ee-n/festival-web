# Festibom 운영 자료

이 폴더에는 GitHub에 올려도 되는 운영 매뉴얼, 자동화 스크립트와 빈 양식만 저장한다.

실제 DB 백업, Storage 파일, 사용자 문의와 개인정보가 포함된 기록은 Git 저장소 밖의 다음 폴더에서 관리한다.

```text
Documents\FestibomOperations\
├─ alerts\              백업·자동화 성공 및 실패 상태
├─ backups\
│  ├─ db\               Supabase public DB 백업
│  └─ storage\          Supabase Storage 파일 백업
├─ logs\                향후 운영 자동화 공통 로그
└─ requests\            문의·오정보·삭제·권리 요청 기록
```

비밀번호, API 키, OAuth secret, S3 access key는 어느 폴더에도 평문으로 저장하지 않고 비밀번호 관리자를 사용한다.

## 문서 위치

- `FESTIBOM_OPERATIONS_FOUNDATIONS.md`: 무엇을 왜 운영해야 하는지 설명
- `OPERATIONS_ROADMAP.md`: 실제 구축 순서와 단계별 완료 기준
- `manual/FESTIBOM_OPERATIONS_MANUAL.md`: 현재 확정된 실제 운영 기준
- `checklists/`: 일간·주간·월간·배포·장애 체크리스트 원본
- `setup/`: 외부 운영 폴더와 날짜별 체크리스트 생성 도구
- `monitoring/README.md`: 성공·실패 기록과 향후 즉시 알림 계획
- `requests/README.md`: 사용자 요청 기록 기준
- `backup/README.md`: DB 자동 백업 사용법
- `restore/README.md`: 운영 DB와 격리된 DB 복구 시험

## 최초 준비

프로젝트 루트에서 한 번 실행한다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\operations\setup\Initialize-FestibomOperations.ps1
```

일간 점검표가 필요할 때는 다음처럼 생성한다. `daily` 대신 `weekly`, `monthly`, `deployment`, `incident`를 사용할 수 있다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\operations\setup\New-FestibomChecklist.ps1 -Type daily
```
