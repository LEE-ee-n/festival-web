[CmdletBinding(SupportsShouldProcess, ConfirmImpact = 'High')]
param(
    [string]$BackupRoot = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'FestibomOperations\backups'),

    [string]$AlertDirectory = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'FestibomOperations\alerts'),

    [ValidateRange(7, 3650)]
    [int]$RetentionDays = 30,

    [ValidateRange(2, 365)]
    [int]$MinimumBackups = 7,

    [ValidateRange(30, 3650)]
    [int]$LogRetentionDays = 90
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$backupRootPath = [System.IO.Path]::GetFullPath($BackupRoot).TrimEnd('\')
$documentsPath = [System.IO.Path]::GetFullPath([Environment]::GetFolderPath('MyDocuments')).TrimEnd('\')
$allowedRoot = Join-Path $documentsPath 'FestibomOperations\backups'
$cutoffUtc = (Get-Date).ToUniversalTime().AddDays(-$RetentionDays)
$logCutoffUtc = (Get-Date).ToUniversalTime().AddDays(-$LogRetentionDays)
$deletedDb = [System.Collections.Generic.List[string]]::new()
$deletedSnapshots = [System.Collections.Generic.List[string]]::new()
$deletedBlobs = [System.Collections.Generic.List[string]]::new()
$deletedLogs = [System.Collections.Generic.List[string]]::new()
$unreferencedBlobCount = 0

function Assert-PathInsideRoot {
    param([Parameter(Mandatory)][string]$Path, [Parameter(Mandatory)][string]$Root)
    $fullPath = [System.IO.Path]::GetFullPath($Path).TrimEnd('\')
    $fullRoot = [System.IO.Path]::GetFullPath($Root).TrimEnd('\')
    if (-not $fullPath.StartsWith($fullRoot + '\', [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Unsafe cleanup path outside backup root: $fullPath"
    }
    return $fullPath
}

function Get-CompleteBackupDirectories {
    param([Parameter(Mandatory)][string]$Root, [Parameter(Mandatory)][string[]]$RequiredFiles)
    if (-not (Test-Path -LiteralPath $Root -PathType Container)) { return @() }
    return @(Get-ChildItem -LiteralPath $Root -Directory -Filter 'festibom-*' |
        Where-Object {
            $directory = $_
            @($RequiredFiles | Where-Object { -not (Test-Path -LiteralPath (Join-Path $directory.FullName $_) -PathType Leaf) }).Count -eq 0
        } |
        Sort-Object LastWriteTimeUtc -Descending)
}

function Select-ExpiredDirectories {
    param([Parameter(Mandatory)][object[]]$Directories)
    if ($Directories.Count -le $MinimumBackups) { return @() }
    $protected = @($Directories | Select-Object -First $MinimumBackups | ForEach-Object FullName)
    return @($Directories | Where-Object {
        $_.LastWriteTimeUtc -lt $cutoffUtc -and $_.FullName -notin $protected
    })
}

if (-not $backupRootPath.Equals($allowedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "BackupRoot must be the Festibom operations backup directory: $allowedRoot"
}

$dbRoot = Assert-PathInsideRoot -Path (Join-Path $backupRootPath 'db') -Root $backupRootPath
$storageRoot = Assert-PathInsideRoot -Path (Join-Path $backupRootPath 'storage') -Root $backupRootPath
$snapshotRoot = Assert-PathInsideRoot -Path (Join-Path $storageRoot 'snapshots') -Root $backupRootPath
$blobRoot = Assert-PathInsideRoot -Path (Join-Path $storageRoot 'blobs\sha256') -Root $backupRootPath

$dbBackups = @(Get-CompleteBackupDirectories -Root $dbRoot -RequiredFiles @('roles.sql', 'schema.sql', 'data.sql', 'manifest.json'))
$dbExpired = @(Select-ExpiredDirectories -Directories $dbBackups)
$storageSnapshots = @(Get-CompleteBackupDirectories -Root $snapshotRoot -RequiredFiles @('manifest.json'))
$storageExpired = @(Select-ExpiredDirectories -Directories $storageSnapshots)

Write-Host 'Festibom backup retention preview'
Write-Host "Policy: keep $RetentionDays days and at least $MinimumBackups complete backups per type"
Write-Host "DB backups: $($dbBackups.Count), eligible for deletion: $($dbExpired.Count)"
Write-Host "Storage snapshots: $($storageSnapshots.Count), eligible for deletion: $($storageExpired.Count)"

foreach ($directory in $dbExpired) {
    if ($PSCmdlet.ShouldProcess($directory.FullName, 'Delete expired DB backup')) {
        Remove-Item -LiteralPath $directory.FullName -Recurse -Force
        $deletedDb.Add($directory.FullName)
    }
}

foreach ($directory in $storageExpired) {
    if ($PSCmdlet.ShouldProcess($directory.FullName, 'Delete expired Storage snapshot')) {
        Remove-Item -LiteralPath $directory.FullName -Recurse -Force
        $deletedSnapshots.Add($directory.FullName)
    }
}

# Storage snapshots share content-addressed blobs. Delete only blobs that no retained manifest references.
$retainedReferences = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
$retainedSnapshots = @(Get-CompleteBackupDirectories -Root $snapshotRoot -RequiredFiles @('manifest.json'))
foreach ($snapshot in $retainedSnapshots) {
    $manifest = Get-Content -Raw -Encoding utf8 -LiteralPath (Join-Path $snapshot.FullName 'manifest.json') | ConvertFrom-Json
    foreach ($object in @($manifest.objects)) {
        if (-not [string]::IsNullOrWhiteSpace([string]$object.blob_path)) {
            $referencedPath = [System.IO.Path]::GetFullPath((Join-Path $storageRoot ([string]$object.blob_path).Replace('/', '\')))
            $null = $retainedReferences.Add($referencedPath)
        }
    }
}

if (Test-Path -LiteralPath $blobRoot -PathType Container) {
    foreach ($blob in Get-ChildItem -LiteralPath $blobRoot -File -Recurse) {
        if (-not $retainedReferences.Contains($blob.FullName)) {
            $unreferencedBlobCount += 1
            if ($PSCmdlet.ShouldProcess($blob.FullName, 'Delete unreferenced Storage blob')) {
                Remove-Item -LiteralPath $blob.FullName -Force
                $deletedBlobs.Add($blob.FullName)
            }
        }
    }
}

$logRoots = @(
    (Join-Path $dbRoot 'logs')
    (Join-Path $storageRoot 'logs')
)
foreach ($logRoot in $logRoots) {
    if (Test-Path -LiteralPath $logRoot -PathType Container) {
        foreach ($log in Get-ChildItem -LiteralPath $logRoot -File | Where-Object LastWriteTimeUtc -lt $logCutoffUtc) {
            if ($PSCmdlet.ShouldProcess($log.FullName, 'Delete expired backup log')) {
                Remove-Item -LiteralPath $log.FullName -Force
                $deletedLogs.Add($log.FullName)
            }
        }
    }
}

$mode = if ($WhatIfPreference) { 'preview' } else { 'applied' }
$report = [ordered]@{
    created_at = (Get-Date).ToUniversalTime().ToString('o')
    mode = $mode
    policy = [ordered]@{ retention_days = $RetentionDays; minimum_backups = $MinimumBackups; log_retention_days = $LogRetentionDays }
    inventory = [ordered]@{ db_backups = $dbBackups.Count; storage_snapshots = $storageSnapshots.Count }
    eligible = [ordered]@{ db_backups = $dbExpired.Count; storage_snapshots = $storageExpired.Count }
    unreferenced_storage_blobs = $unreferencedBlobCount
    deleted = [ordered]@{ db_backups = @($deletedDb); storage_snapshots = @($deletedSnapshots); storage_blobs = @($deletedBlobs); logs = @($deletedLogs) }
}

$reportPath = $null
if (-not $WhatIfPreference) {
    New-Item -ItemType Directory -Path $AlertDirectory -Force | Out-Null
    $reportPath = Join-Path $AlertDirectory ("retention-{0}-{1}.json" -f (Get-Date -Format 'yyyyMMdd-HHmmss'), $mode)
    $report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $reportPath -Encoding utf8
}
Write-Host "Mode: $mode"
Write-Host "Unreferenced Storage blobs eligible for deletion: $unreferencedBlobCount"
Write-Host "Deleted DB backups: $($deletedDb.Count)"
Write-Host "Deleted Storage snapshots: $($deletedSnapshots.Count)"
Write-Host "Deleted unreferenced Storage blobs: $($deletedBlobs.Count)"
Write-Host "Deleted old logs: $($deletedLogs.Count)"
if ($null -ne $reportPath) { Write-Host "Report: $reportPath" }
