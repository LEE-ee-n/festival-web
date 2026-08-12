[CmdletBinding()]
param(
    [ValidateSet('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')]
    [string]$DayOfWeek = 'Sunday',

    [ValidatePattern('^(?:[01]\d|2[0-3]):[0-5]\d$')]
    [string]$WeeklyAt = '22:30',

    [ValidateRange(7, 3650)]
    [int]$RetentionDays = 30,

    [ValidateRange(2, 365)]
    [int]$MinimumBackups = 7,

    [string]$TaskName = 'Festibom Backup Retention'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$scheduledScript = Join-Path $PSScriptRoot 'run-scheduled-backup-retention.ps1'
if (-not (Test-Path -LiteralPath $scheduledScript -PathType Leaf)) {
    throw "Scheduled retention script was not found: $scheduledScript"
}

$action = New-ScheduledTaskAction `
    -Execute 'powershell.exe' `
    -Argument "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$scheduledScript`" -RetentionDays $RetentionDays -MinimumBackups $MinimumBackups" `
    -WorkingDirectory $PSScriptRoot
$trigger = New-ScheduledTaskTrigger -Weekly -WeeksInterval 1 -DaysOfWeek $DayOfWeek -At $WeeklyAt
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopIfGoingOnBatteries -AllowStartIfOnBatteries -ExecutionTimeLimit ([TimeSpan]::FromMinutes(30))

Register-ScheduledTask `
    -TaskName $TaskName `
    -Description 'Deletes expired Festibom backups while preserving the minimum count and referenced Storage blobs.' `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -User $env:USERNAME `
    -RunLevel Limited `
    -Force | Out-Null

Write-Host 'Windows scheduled task registered.'
Write-Host "Task: $TaskName"
Write-Host "Weekly: $DayOfWeek $WeeklyAt"
Write-Host "Policy: $RetentionDays days, minimum $MinimumBackups per type"
Get-ScheduledTaskInfo -TaskName $TaskName
