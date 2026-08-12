[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$DriveRoot,
    [ValidatePattern('^(?:[01]\d|2[0-3]):[0-5]\d$')][string]$DailyAt = '22:10',
    [ValidateRange(1, 90)][int]$KeepDays = 7,
    [string]$TaskName = 'Festibom Google Drive Backup'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$scheduledScript = Join-Path $PSScriptRoot 'run-scheduled-offsite-backup.ps1'
$driveRootPath = [System.IO.Path]::GetFullPath($DriveRoot).TrimEnd('\')
if (-not (Test-Path -LiteralPath $driveRootPath -PathType Container)) { throw "Google Drive root was not found: $driveRootPath" }

$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$scheduledScript`" -DriveRoot `"$driveRootPath`" -KeepDays $KeepDays" -WorkingDirectory $PSScriptRoot
$trigger = New-ScheduledTaskTrigger -Daily -At $DailyAt
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopIfGoingOnBatteries -AllowStartIfOnBatteries -ExecutionTimeLimit ([TimeSpan]::FromHours(2))
Register-ScheduledTask -TaskName $TaskName -Description 'Creates verified DB and Storage ZIP archives in Google Drive.' -Action $action -Trigger $trigger -Settings $settings -User $env:USERNAME -RunLevel Limited -Force | Out-Null
Write-Host 'Windows scheduled task registered.'
Write-Host "Task: $TaskName"
Write-Host "Daily at: $DailyAt"
Write-Host "Google Drive: $driveRootPath"
Write-Host "Cloud retention: $KeepDays days"
Get-ScheduledTaskInfo -TaskName $TaskName
