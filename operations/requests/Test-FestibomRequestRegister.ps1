[CmdletBinding()]
param(
    [string]$OperationsRoot = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'FestibomOperations'),
    [ValidateRange(1, 168)][int]$RepeatAlertAfterHours = 24,
    [switch]$ShowSuccess,
    [switch]$NoPopup
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$registerPath = Join-Path $OperationsRoot 'requests\request-register.csv'
$alertDirectory = Join-Path $OperationsRoot 'alerts'
$statePath = Join-Path $alertDirectory 'latest-request-check.json'
$notificationScript = Join-Path (Split-Path -Parent $PSScriptRoot) 'alerts\Send-FestibomOperationAlert.ps1'
New-Item -ItemType Directory -Path $alertDirectory -Force | Out-Null

$records = if (Test-Path -LiteralPath $registerPath -PathType Leaf) { @(Import-Csv -LiteralPath $registerPath) } else { @() }
$active = @($records | Where-Object { $_.status -notin @('완료', '취소') })
$today = (Get-Date).Date
$overdue = @($active | Where-Object {
    $due = [datetime]::MinValue
    [datetime]::TryParseExact([string]$_.due_date, 'yyyy-MM-dd', [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::None, [ref]$due) -and $due.Date -lt $today
})

$signatureText = @($active | Sort-Object request_id | ForEach-Object { "$($_.request_id):$($_.status):$($_.due_date)" }) -join '|'
$signature = $null
if ($signatureText) {
    $sha = [Security.Cryptography.SHA256]::Create()
    try { $signature = ([BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($signatureText)))).Replace('-', '').ToLowerInvariant() }
    finally { $sha.Dispose() }
}

$now = [DateTimeOffset]::Now
$shouldNotify = $active.Count -gt 0
if ($shouldNotify -and (Test-Path -LiteralPath $statePath -PathType Leaf)) {
    try {
        $previous = Get-Content -Raw -Encoding utf8 -LiteralPath $statePath | ConvertFrom-Json
        $lastNotified = [DateTimeOffset]::Parse([string]$previous.notified_at)
        if ([string]$previous.signature -eq $signature -and ($now - $lastNotified).TotalHours -lt $RepeatAlertAfterHours) { $shouldNotify = $false }
    }
    catch { $shouldNotify = $true }
}

$lastNotification = $null
if ($shouldNotify) {
    $message = "미처리 요청 $($active.Count)건"
    if ($overdue.Count -gt 0) { $message += ", 기한 초과 $($overdue.Count)건" }
    $message += "이 있습니다.`r`n대장: $registerPath"
    & $notificationScript -Severity warning -Title 'Festibom 사용자 요청 확인' -Message $message -AlertDirectory $alertDirectory -NoPopup:$NoPopup
    $lastNotification = $now.ToUniversalTime().ToString('o')
}
elseif ($active.Count -eq 0 -and $ShowSuccess) {
    & $notificationScript -Severity success -Title 'Festibom 사용자 요청 확인' -Message '미처리 사용자 요청이 없습니다.' -AlertDirectory $alertDirectory -TimeoutSeconds 15 -NoPopup:$NoPopup
}

$state = [ordered]@{
    checked_at = $now.ToUniversalTime().ToString('o')
    status = if ($overdue.Count -gt 0) { 'overdue' } elseif ($active.Count -gt 0) { 'pending' } else { 'clear' }
    active_count = $active.Count
    overdue_count = $overdue.Count
    signature = $signature
    notified = $shouldNotify
    notified_at = $lastNotification
    active_requests = @($active | Select-Object request_id, type, priority, status, due_date, summary)
}
$state | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $statePath -Encoding utf8

Write-Host "Request register check: $($state.status.ToUpperInvariant())"
Write-Host "Active: $($active.Count)"
Write-Host "Overdue: $($overdue.Count)"
Write-Host "Register: $registerPath"
exit 0
