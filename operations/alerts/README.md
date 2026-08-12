# Festibom 백업 알림

- DB, Storage, Google Drive 백업 실패 시 Windows 팝업을 표시합니다.
- 매일 22:40에 예약 작업 결과와 최신 상태 기록을 다시 검사합니다.
- 정상 기록이 26시간 이상 갱신되지 않아도 알림을 표시합니다.
- 같은 문제가 계속되면 팝업은 24시간에 한 번만 반복됩니다.
- 검사 결과는 `Documents\FestibomOperations\alerts`에 JSON으로 보관합니다.

## 알림 표시 테스트

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\operations\alerts\Test-FestibomBackupAlerts.ps1" -TestAlert
```

## 예약 작업 등록

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\operations\alerts\Install-FestibomBackupAlertTask.ps1" -DailyAt "22:40"
```

## 백업 상태 수동 검사

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\operations\alerts\Test-FestibomBackupAlerts.ps1" -ShowSuccess
```
