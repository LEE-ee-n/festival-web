# Google Drive offsite backup

- Runs daily at 22:10 after DB and Storage backups.
- Creates one DB ZIP, one Storage ZIP, and one SHA-256 manifest.
- Keeps the latest 7 days in `Google Drive/FestibomBackup`.
- The Storage ZIP contains only blobs referenced by the latest snapshot.
- Google Drive for desktop performs the actual cloud upload.

Install after connecting Google Drive for desktop:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\operations\backup\Install-FestibomOffsiteBackupTask.ps1" -DriveRoot "G:\My Drive" -DailyAt "22:10"
```
