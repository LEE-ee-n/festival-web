[CmdletBinding()]
param(
    [ValidatePattern('^(?:[01]\d|2[0-3]):[0-5]\d$')]
    [string]$DailyAt = '22:40',

    [string]$TaskName = 'Festibom Backup Alert Check',

    [string]$AlertDirectory = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'FestibomOperations\alerts')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$checkScript = Join-Path $PSScriptRoot 'Test-FestibomBackupAlerts.ps1'
if (-not (Test-Path -LiteralPath $checkScript -PathType Leaf)) {
    throw "Alert check script was not found: $checkScript"
}

$action = New-ScheduledTaskAction `
    -Execute 'powershell.exe' `
    -Argument "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$checkScript`" -AlertDirectory `"$AlertDirectory`"" `
    -WorkingDirectory $PSScriptRoot
$trigger = New-ScheduledTaskTrigger -Daily -At $DailyAt
$settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -DontStopIfGoingOnBatteries `
    -AllowStartIfOnBatteries `
    -ExecutionTimeLimit ([TimeSpan]::FromMinutes(10))

Register-ScheduledTask `
    -TaskName $TaskName `
    -Description 'Checks Festibom DB, Storage, and Google Drive backup status and displays a Windows alert when attention is required.' `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -User $env:USERNAME `
    -RunLevel Limited `
    -Force | Out-Null

Write-Host 'Windows scheduled task registered.'
Write-Host "Task: $TaskName"
Write-Host "Daily at: $DailyAt"
Write-Host "Alert records: $AlertDirectory"
Get-ScheduledTaskInfo -TaskName $TaskName
