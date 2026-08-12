[CmdletBinding()]
param(
    [string]$OperationsRoot = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'FestibomOperations')
)

$ErrorActionPreference = 'Stop'
$projectOperations = Split-Path -Parent $PSScriptRoot
$checklistSource = Join-Path $projectOperations 'checklists'

$directories = @(
    $OperationsRoot,
    (Join-Path $OperationsRoot 'alerts'),
    (Join-Path $OperationsRoot 'backups\db'),
    (Join-Path $OperationsRoot 'backups\storage'),
    (Join-Path $OperationsRoot 'backups\storage\blobs\sha256'),
    (Join-Path $OperationsRoot 'backups\storage\snapshots'),
    (Join-Path $OperationsRoot 'checklists\daily'),
    (Join-Path $OperationsRoot 'checklists\weekly'),
    (Join-Path $OperationsRoot 'checklists\monthly'),
    (Join-Path $OperationsRoot 'deployments'),
    (Join-Path $OperationsRoot 'incidents'),
    (Join-Path $OperationsRoot 'logs'),
    (Join-Path $OperationsRoot 'reports'),
    (Join-Path $OperationsRoot 'restore-tests'),
    (Join-Path $OperationsRoot 'requests'),
    (Join-Path $OperationsRoot 'requests\exports')
)

foreach ($directory in $directories) {
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
}

$referenceTarget = Join-Path $OperationsRoot 'checklists\templates'
New-Item -ItemType Directory -Path $referenceTarget -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $checklistSource 'DAILY.md') -Destination $referenceTarget -Force
Copy-Item -LiteralPath (Join-Path $checklistSource 'WEEKLY.md') -Destination $referenceTarget -Force
Copy-Item -LiteralPath (Join-Path $checklistSource 'MONTHLY.md') -Destination $referenceTarget -Force
Copy-Item -LiteralPath (Join-Path $checklistSource 'DEPLOYMENT.md') -Destination $referenceTarget -Force
Copy-Item -LiteralPath (Join-Path $checklistSource 'INCIDENT.md') -Destination $referenceTarget -Force

Write-Host "Festibom 운영 폴더 준비 완료: $OperationsRoot"
Write-Host "체크리스트 원본: $referenceTarget"
