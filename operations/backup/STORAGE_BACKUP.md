# Festibom Supabase Storage backup

Supabase database backups contain Storage metadata but not the actual image files. This backup downloads every object from every Storage bucket to a local directory outside Git.

## Design

- Original files are stored once under `blobs/sha256` using their SHA-256 hash.
- Each run creates `snapshots/festibom-*/manifest.json` with the bucket, original path, size, MIME type, timestamps, and hash.
- Unchanged files reuse the existing local blob, so daily snapshots do not duplicate image bytes.
- Deleted remote files remain available through older snapshot manifests.
- The health check verifies that every referenced blob exists and its SHA-256 matches.
- No automatic deletion is performed until restore testing and a retention policy are complete.

## Required environment variables

The repository `.env` or `.env.local` must contain:

- `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL`
- `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`

The secret key is server-only and must never use a `NEXT_PUBLIC_` prefix or be committed to Git.

## First run and verification

```powershell
Set-Location -LiteralPath "C:\Users\소닉스\Documents\festibom"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\operations\backup\run-supabase-storage-backup.ps1"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\operations\backup\Test-FestibomStorageBackup.ps1"
```

## Daily scheduled task

Run after the 21:00 database backup:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\operations\backup\install-windows-storage-backup-task.ps1" -DailyAt "21:30"
```

Confirm the task:

```powershell
Start-ScheduledTask -TaskName "Festibom Supabase Storage Backup"
Get-ScheduledTaskInfo -TaskName "Festibom Supabase Storage Backup"
```

Success means `LastTaskResult` is `0` and the health check reports `All object SHA-256 hashes matched.`
