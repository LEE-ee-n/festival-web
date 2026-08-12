[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateSet('문의', '오정보', '개인정보', '이미지·저작권', '삭제')]
    [string]$Type,

    [Parameter(Mandatory)][ValidateNotNullOrEmpty()][string]$Summary,

    [string]$Target = '',

    [ValidateSet('이메일', '사이트', '인스타그램', '기타')]
    [string]$Channel = '이메일',

    [string]$ContactReference = '',

    [ValidateSet('낮음', '보통', '높음', '긴급')]
    [string]$Priority = '보통',

    [ValidateRange(1, 90)][int]$DueInDays = 7,

    [string]$OperationsRoot = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'FestibomOperations')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$requestDirectory = Join-Path $OperationsRoot 'requests'
$registerPath = Join-Path $requestDirectory 'request-register.csv'
New-Item -ItemType Directory -Path $requestDirectory -Force | Out-Null

$today = Get-Date
$datePrefix = 'REQ-{0}-' -f $today.ToString('yyyyMMdd')
$sequence = 1
if (Test-Path -LiteralPath $registerPath -PathType Leaf) {
    $todaysIds = @(Import-Csv -LiteralPath $registerPath | Where-Object { $_.request_id -like "$datePrefix*" } | ForEach-Object request_id)
    if ($todaysIds.Count -gt 0) {
        $numbers = @($todaysIds | ForEach-Object { if ($_ -match '(\d{4})$') { [int]$Matches[1] } })
        if ($numbers.Count -gt 0) { $sequence = ($numbers | Measure-Object -Maximum).Maximum + 1 }
    }
}

$now = [DateTimeOffset]::Now
$record = [pscustomobject][ordered]@{
    request_id = '{0}{1:D4}' -f $datePrefix, $sequence
    received_at = $now.ToString('o')
    type = $Type
    channel = $Channel
    contact_reference = $ContactReference
    target = $Target
    summary = $Summary
    priority = $Priority
    status = '접수'
    due_date = $today.Date.AddDays($DueInDays).ToString('yyyy-MM-dd')
    resolution = ''
    completed_at = ''
    updated_at = $now.ToString('o')
}

if (Test-Path -LiteralPath $registerPath -PathType Leaf) {
    $record | Export-Csv -LiteralPath $registerPath -NoTypeInformation -Encoding utf8 -Append
}
else {
    $record | Export-Csv -LiteralPath $registerPath -NoTypeInformation -Encoding utf8
}

Write-Host 'Request registered.'
Write-Host "ID: $($record.request_id)"
Write-Host "Type: $Type"
Write-Host "Status: $($record.status)"
Write-Host "Due date: $($record.due_date)"
Write-Host "Register: $registerPath"
