[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateSet('daily', 'weekly', 'monthly', 'deployment', 'incident')]
    [string]$Type,
    [string]$OperationsRoot = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'FestibomOperations')
)

$ErrorActionPreference = 'Stop'
$projectOperations = Split-Path -Parent $PSScriptRoot
$sourceName = switch ($Type) {
    'daily' { 'DAILY.md' }
    'weekly' { 'WEEKLY.md' }
    'monthly' { 'MONTHLY.md' }
    'deployment' { 'DEPLOYMENT.md' }
    'incident' { 'INCIDENT.md' }
}
$targetFolder = switch ($Type) {
    'daily' { 'checklists\daily' }
    'weekly' { 'checklists\weekly' }
    'monthly' { 'checklists\monthly' }
    'deployment' { 'deployments' }
    'incident' { 'incidents' }
}
$timestamp = if ($Type -in @('deployment', 'incident')) {
    Get-Date -Format 'yyyyMMdd-HHmmss'
} else {
    Get-Date -Format 'yyyy-MM-dd'
}

$source = Join-Path (Join-Path $projectOperations 'checklists') $sourceName
$targetDirectory = Join-Path $OperationsRoot $targetFolder
$target = Join-Path $targetDirectory "$timestamp-$Type.md"

New-Item -ItemType Directory -Path $targetDirectory -Force | Out-Null
if (Test-Path -LiteralPath $target) {
    Write-Host "이미 존재합니다: $target"
    exit 0
}

Copy-Item -LiteralPath $source -Destination $target
Write-Host "체크리스트 생성 완료: $target"
