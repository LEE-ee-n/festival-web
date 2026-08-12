[CmdletBinding()]
param(
    [string]$AlertDirectory = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'FestibomOperations\alerts'),

    [ValidateRange(1, 168)]
    [int]$MaximumStatusAgeHours = 26,

    [ValidateRange(1, 168)]
    [int]$RepeatAlertAfterHours = 24,

    [switch]$TestAlert,
    [switch]$ShowSuccess,
    [switch]$NoPopup
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$notificationScript = Join-Path $PSScriptRoot 'Send-FestibomOperationAlert.ps1'
$statePath = Join-Path $AlertDirectory 'latest-alert-check.json'

if (-not (Test-Path -LiteralPath $notificationScript -PathType Leaf)) {
    throw "Notification script was not found: $notificationScript"
}
New-Item -ItemType Directory -Path $AlertDirectory -Force | Out-Null

if ($TestAlert) {
    & $notificationScript -Severity test -Message '백업 실패 알림이 정상적으로 표시됩니다.' -AlertDirectory $AlertDirectory -TimeoutSeconds 15 -NoPopup:$NoPopup
    exit 0
}

$checks = @(
    [pscustomobject]@{
        Name = 'DB'
        TaskName = 'Festibom Supabase DB Backup'
        StatusPath = Join-Path $AlertDirectory 'latest-backup-status.json'
    },
    [pscustomobject]@{
        Name = 'Storage'
        TaskName = 'Festibom Supabase Storage Backup'
        StatusPath = Join-Path $AlertDirectory 'latest-storage-backup-status.json'
    },
    [pscustomobject]@{
        Name = 'Google Drive'
        TaskName = 'Festibom Google Drive Backup'
        StatusPath = Join-Path $AlertDirectory 'latest-offsite-backup-status.json'
    }
)

$now = Get-Date
$issues = [System.Collections.Generic.List[object]]::new()
$results = [System.Collections.Generic.List[object]]::new()

foreach ($check in $checks) {
    $taskResult = $null
    $lastRunTime = $null
    try {
        $taskInfo = Get-ScheduledTaskInfo -TaskName $check.TaskName -ErrorAction Stop
        $taskResult = [int64]$taskInfo.LastTaskResult
        $lastRunTime = $taskInfo.LastRunTime
        if ($taskResult -ne 0) {
            $issues.Add([pscustomobject]@{ Code = "$($check.Name)-task-$taskResult"; Message = "$($check.Name) 예약 작업 결과 코드: $taskResult" })
        }
    }
    catch {
        $issues.Add([pscustomobject]@{ Code = "$($check.Name)-task-missing"; Message = "$($check.Name) 예약 작업을 확인할 수 없습니다." })
    }

    $status = $null
    $ageHours = $null
    if (-not (Test-Path -LiteralPath $check.StatusPath -PathType Leaf)) {
        $issues.Add([pscustomobject]@{ Code = "$($check.Name)-status-missing"; Message = "$($check.Name) 최신 상태 기록이 없습니다." })
    }
    else {
        try {
            $status = Get-Content -Raw -Encoding utf8 -LiteralPath $check.StatusPath | ConvertFrom-Json
            $occurredAt = [DateTimeOffset]::Parse([string]$status.occurred_at).LocalDateTime
            $ageHours = ($now - $occurredAt).TotalHours
            if ([string]$status.status -ne 'success') {
                $issues.Add([pscustomobject]@{ Code = "$($check.Name)-status-failure"; Message = "$($check.Name) 백업 실패: $($status.message)" })
            }
            elseif ($ageHours -gt $MaximumStatusAgeHours) {
                $issues.Add([pscustomobject]@{ Code = "$($check.Name)-status-stale"; Message = "$($check.Name) 정상 백업 기록이 $([math]::Round($ageHours, 1))시간 동안 갱신되지 않았습니다." })
            }
        }
        catch {
            $issues.Add([pscustomobject]@{ Code = "$($check.Name)-status-invalid"; Message = "$($check.Name) 상태 기록을 읽을 수 없습니다." })
        }
    }

    $results.Add([pscustomobject]@{
        backup = $check.Name
        task_result = $taskResult
        last_run_time = $lastRunTime
        status = if ($null -ne $status) { [string]$status.status } else { $null }
        status_age_hours = if ($null -ne $ageHours) { [math]::Round($ageHours, 1) } else { $null }
    })
}

$issueCodes = @($issues | ForEach-Object Code | Sort-Object)
$signatureText = $issueCodes -join '|'
$signature = if ($signatureText) {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($signatureText)
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    try {
        ([System.BitConverter]::ToString($sha256.ComputeHash($bytes))).Replace('-', '').ToLowerInvariant()
    }
    finally {
        $sha256.Dispose()
    }
} else { $null }

$shouldNotify = $issues.Count -gt 0
$lastNotificationAtUtc = $null
if ($shouldNotify -and (Test-Path -LiteralPath $statePath -PathType Leaf)) {
    try {
        $previous = Get-Content -Raw -Encoding utf8 -LiteralPath $statePath | ConvertFrom-Json
        $lastNotifiedAt = [DateTimeOffset]::Parse([string]$previous.notified_at).LocalDateTime
        $lastNotificationAtUtc = [DateTimeOffset]::Parse([string]$previous.notified_at).ToUniversalTime().ToString('o')
        if ([string]$previous.signature -eq $signature -and ($now - $lastNotifiedAt).TotalHours -lt $RepeatAlertAfterHours) {
            $shouldNotify = $false
        }
    }
    catch {
        $shouldNotify = $true
    }
}

if ($shouldNotify) {
    $message = (@($issues | ForEach-Object Message) -join "`r`n") + "`r`n기록: $AlertDirectory"
    & $notificationScript -Severity failure -Message $message -AlertDirectory $AlertDirectory -NoPopup:$NoPopup
    $lastNotificationAtUtc = $now.ToUniversalTime().ToString('o')
}
elseif ($issues.Count -eq 0 -and $ShowSuccess) {
    & $notificationScript -Severity success -Message 'DB, Storage, Google Drive 백업 상태가 모두 정상입니다.' -AlertDirectory $AlertDirectory -TimeoutSeconds 15 -NoPopup:$NoPopup
}

$state = [ordered]@{
    checked_at = $now.ToUniversalTime().ToString('o')
    status = if ($issues.Count -eq 0) { 'success' } else { 'failure' }
    signature = $signature
    notified = $shouldNotify
    notified_at = $lastNotificationAtUtc
    issues = @($issues)
    checks = @($results)
}
$state | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $statePath -Encoding utf8

if ($issues.Count -eq 0) {
    Write-Host 'Backup alert check: OK'
    foreach ($result in $results) {
        Write-Host "[OK] $($result.backup) - task result $($result.task_result), status age $($result.status_age_hours) hours"
    }
    exit 0
}

Write-Host 'Backup alert check: ATTENTION REQUIRED'
foreach ($issue in $issues) {
    Write-Host "[ALERT] $($issue.Message)"
}
exit 1
