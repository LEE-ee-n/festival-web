# Backup retention

Default policy:

- Keep complete DB backups and Storage snapshots for 30 days.
- Always retain at least the latest 7 complete backups of each type.
- Keep backup logs for 90 days.
- Remove a Storage blob only when no retained snapshot references it.
- Write cleanup reports to `Documents\FestibomOperations\alerts`.

Preview without deletion:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\operations\backup\Invoke-FestibomBackupRetention.ps1" -WhatIf
```

Install the weekly cleanup task:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\operations\backup\Install-FestibomBackupRetentionTask.ps1" -DayOfWeek Sunday -WeeklyAt "22:30"
```
