[CmdletBinding()]
param(
  [ValidateNotNullOrEmpty()]
  [string]$Destination = (Join-Path ([Environment]::GetFolderPath("MyDocuments")) "FestibomOperations\backups\storage"),
  [ValidatePattern("^(?:[01]\d|2[0-3]):[0-5]\d$")]
  [string]$DailyAt = "21:30",
  [ValidateNotNullOrEmpty()]
  [string]$TaskName = "Festibom Supabase Storage Backup"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$scheduledScript = Join-Path $PSScriptRoot "run-scheduled-supabase-storage-backup.ps1"
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$scheduledScript`" -Destination `"$Destination`"" -WorkingDirectory $PSScriptRoot
$trigger = New-ScheduledTaskTrigger -Daily -At $DailyAt
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopIfGoingOnBatteries -AllowStartIfOnBatteries -ExecutionTimeLimit ([TimeSpan]::FromHours(4))
Register-ScheduledTask -TaskName $TaskName -Description "Backs up all Festibom Supabase Storage objects and verifies SHA-256 hashes." -Action $action -Trigger $trigger -Settings $settings -User $env:USERNAME -RunLevel Limited -Force | Out-Null
Write-Host "Windows scheduled task registered."
Write-Host "Task: $TaskName"
Write-Host "Daily at: $DailyAt"
Write-Host "Destination: $Destination"
Get-ScheduledTaskInfo -TaskName $TaskName
