[CmdletBinding()]
param(
    [ValidatePattern('^(?:[01]\d|2[0-3]):[0-5]\d$')][string]$DailyAt = '20:30',
    [string]$TaskName = 'Festibom User Request Check',
    [string]$OperationsRoot = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'FestibomOperations')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$checkScript = Join-Path $PSScriptRoot 'Test-FestibomRequestRegister.ps1'
if (-not (Test-Path -LiteralPath $checkScript -PathType Leaf)) { throw "Request check script was not found: $checkScript" }

$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$checkScript`" -OperationsRoot `"$OperationsRoot`"" -WorkingDirectory $PSScriptRoot
$trigger = New-ScheduledTaskTrigger -Daily -At $DailyAt
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopIfGoingOnBatteries -AllowStartIfOnBatteries -ExecutionTimeLimit ([TimeSpan]::FromMinutes(10))
Register-ScheduledTask -TaskName $TaskName -Description 'Checks unresolved Festibom user requests and displays a Windows reminder.' -Action $action -Trigger $trigger -Settings $settings -User $env:USERNAME -RunLevel Limited -Force | Out-Null

Write-Host 'Windows scheduled task registered.'
Write-Host "Task: $TaskName"
Write-Host "Daily at: $DailyAt"
Write-Host "Request register: $(Join-Path $OperationsRoot 'requests\request-register.csv')"
Get-ScheduledTaskInfo -TaskName $TaskName
