[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidateNotNullOrEmpty()][string]$RequestId,

    [Parameter(Mandatory)]
    [ValidateSet('접수', '확인 중', '보류', '완료', '취소')]
    [string]$Status,

    [string]$Resolution = '',

    [string]$OperationsRoot = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'FestibomOperations')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$registerPath = Join-Path $OperationsRoot 'requests\request-register.csv'
if (-not (Test-Path -LiteralPath $registerPath -PathType Leaf)) { throw "Request register was not found: $registerPath" }

$records = @(Import-Csv -LiteralPath $registerPath)
$matches = @($records | Where-Object request_id -eq $RequestId)
if ($matches.Count -ne 1) { throw "Request ID was not found or is duplicated: $RequestId" }

$now = [DateTimeOffset]::Now
foreach ($record in $records) {
    if ($record.request_id -ne $RequestId) { continue }
    $record.status = $Status
    if (-not [string]::IsNullOrWhiteSpace($Resolution)) { $record.resolution = $Resolution }
    $record.completed_at = if ($Status -in @('완료', '취소')) { $now.ToString('o') } else { '' }
    $record.updated_at = $now.ToString('o')
}

$tempPath = "$registerPath.tmp"
$records | Export-Csv -LiteralPath $tempPath -NoTypeInformation -Encoding utf8
Move-Item -LiteralPath $tempPath -Destination $registerPath -Force

Write-Host 'Request updated.'
Write-Host "ID: $RequestId"
Write-Host "Status: $Status"
Write-Host "Register: $registerPath"
