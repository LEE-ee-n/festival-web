[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateNotNullOrEmpty()]
    [string]$DriveRoot,

    [string]$BackupRoot = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'FestibomOperations\backups'),

    [string]$WorkingRoot = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'FestibomOperations\offsite-staging'),

    [string]$AlertDirectory = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'FestibomOperations\alerts'),

    [ValidateRange(1, 90)]
    [int]$KeepDays = 7,

    [ValidateRange(1, 72)]
    [int]$MaximumBackupAgeHours = 26
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$startedAt = Get-Date
$dateStamp = $startedAt.ToString('yyyy-MM-dd')
$backupRootPath = [System.IO.Path]::GetFullPath($BackupRoot).TrimEnd('\')
$driveRootPath = [System.IO.Path]::GetFullPath($DriveRoot).TrimEnd('\')
$destination = Join-Path $driveRootPath 'FestibomBackup'
$runRoot = Join-Path $WorkingRoot ("offsite-{0}-{1}" -f $dateStamp, $startedAt.ToString('HHmmss'))
$dbStage = Join-Path $runRoot 'db'
$storageStage = Join-Path $runRoot 'storage'
$dbZip = Join-Path $destination "festibom-db-$dateStamp.zip"
$storageZip = Join-Path $destination "festibom-storage-$dateStamp.zip"
$manifestPath = Join-Path $destination "festibom-offsite-$dateStamp.json"

function Get-LatestCompleteDirectory {
    param([string]$Root, [string[]]$RequiredFiles)
    $directory = Get-ChildItem -LiteralPath $Root -Directory -Filter 'festibom-*' |
        Where-Object {
            $candidate = $_
            @($RequiredFiles | Where-Object { -not (Test-Path -LiteralPath (Join-Path $candidate.FullName $_) -PathType Leaf) }).Count -eq 0
        } |
        Sort-Object LastWriteTimeUtc -Descending |
        Select-Object -First 1
    if ($null -eq $directory) { throw "No complete backup was found: $Root" }
    if (((Get-Date).ToUniversalTime() - $directory.LastWriteTimeUtc).TotalHours -gt $MaximumBackupAgeHours) {
        throw "Latest backup is older than $MaximumBackupAgeHours hours: $($directory.FullName)"
    }
    return $directory
}
function Assert-DbBackupIntegrity {
    param([string]$Directory)
    $manifest = Get-Content -Raw -Encoding utf8 -LiteralPath (Join-Path $Directory 'manifest.json') | ConvertFrom-Json
    foreach ($file in @($manifest.files)) {
        $path = Join-Path $Directory ([string]$file.name)
        $hash = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($hash -ne ([string]$file.sha256).ToLowerInvariant()) { throw "DB backup hash mismatch: $path" }
    }
}

if (-not (Test-Path -LiteralPath $driveRootPath -PathType Container)) {
    throw "Google Drive root was not found: $driveRootPath"
}
if ($driveRootPath.StartsWith($backupRootPath, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'Google Drive destination must be separate from the local backup directory.'
}

$dbSource = Get-LatestCompleteDirectory -Root (Join-Path $backupRootPath 'db') -RequiredFiles @('roles.sql', 'schema.sql', 'data.sql', 'manifest.json')
$snapshotSource = Get-LatestCompleteDirectory -Root (Join-Path $backupRootPath 'storage\snapshots') -RequiredFiles @('manifest.json')
Assert-DbBackupIntegrity -Directory $dbSource.FullName

New-Item -ItemType Directory -Path $destination, $dbStage, $storageStage -Force | Out-Null
try {
    Write-Host "DB source: $($dbSource.FullName)"
    foreach ($name in @('roles.sql', 'schema.sql', 'data.sql', 'manifest.json')) {
        Copy-Item -LiteralPath (Join-Path $dbSource.FullName $name) -Destination (Join-Path $dbStage $name) -Force
    }

    $storageManifestPath = Join-Path $snapshotSource.FullName 'manifest.json'
    $storageManifest = Get-Content -Raw -Encoding utf8 -LiteralPath $storageManifestPath | ConvertFrom-Json
    Copy-Item -LiteralPath $storageManifestPath -Destination (Join-Path $storageStage 'manifest.json') -Force
    $copiedBlobs = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
    foreach ($object in @($storageManifest.objects)) {
        $relativeBlob = ([string]$object.blob_path).Replace('/', '\')
        if (-not $copiedBlobs.Add($relativeBlob)) { continue }
        $sourceBlob = Join-Path (Join-Path $backupRootPath 'storage') $relativeBlob
        if (-not (Test-Path -LiteralPath $sourceBlob -PathType Leaf)) { throw "Storage blob is missing: $sourceBlob" }
        $actualHash = (Get-FileHash -LiteralPath $sourceBlob -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($actualHash -ne ([string]$object.sha256).ToLowerInvariant()) { throw "Storage blob hash mismatch: $sourceBlob" }
        $targetBlob = Join-Path $storageStage $relativeBlob
        New-Item -ItemType Directory -Path (Split-Path $targetBlob -Parent) -Force | Out-Null
        Copy-Item -LiteralPath $sourceBlob -Destination $targetBlob -Force
    }

    foreach ($zipPath in @($dbZip, $storageZip)) {
        if (Test-Path -LiteralPath $zipPath -PathType Leaf) { Remove-Item -LiteralPath $zipPath -Force }
    }
    Write-Host 'Creating DB ZIP.'
    Compress-Archive -Path (Join-Path $dbStage '*') -DestinationPath $dbZip -CompressionLevel Optimal
    Write-Host "Creating Storage ZIP with $($copiedBlobs.Count) unique blobs."
    Compress-Archive -Path (Join-Path $storageStage '*') -DestinationPath $storageZip -CompressionLevel Optimal

    $offsiteManifest = [ordered]@{
        created_at = (Get-Date).ToUniversalTime().ToString('o')
        source = [ordered]@{ db_backup = $dbSource.FullName; storage_snapshot = $snapshotSource.FullName }
        files = @(
            [ordered]@{ name = (Split-Path $dbZip -Leaf); bytes = (Get-Item $dbZip).Length; sha256 = (Get-FileHash $dbZip -Algorithm SHA256).Hash.ToLowerInvariant() },
            [ordered]@{ name = (Split-Path $storageZip -Leaf); bytes = (Get-Item $storageZip).Length; sha256 = (Get-FileHash $storageZip -Algorithm SHA256).Hash.ToLowerInvariant() }
        )
        storage = [ordered]@{ objects = [int64]$storageManifest.object_count; unique_blobs = $copiedBlobs.Count; logical_bytes = [int64]$storageManifest.total_bytes }
    }
    $offsiteManifest | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $manifestPath -Encoding utf8

    $cutoff = (Get-Date).Date.AddDays(-$KeepDays)
    foreach ($file in Get-ChildItem -LiteralPath $destination -File -Filter 'festibom-*') {
        if ($file.LastWriteTime -lt $cutoff -and $file.Name -match '^festibom-(db|storage|offsite)-\d{4}-\d{2}-\d{2}\.(zip|json)$') {
            Remove-Item -LiteralPath $file.FullName -Force
        }
    }

    New-Item -ItemType Directory -Path $AlertDirectory -Force | Out-Null
    $status = [ordered]@{ occurred_at = (Get-Date).ToUniversalTime().ToString('o'); task = 'Festibom Offsite Backup'; status = 'success'; destination = $destination; manifest = $manifestPath } | ConvertTo-Json
    $status | Set-Content -LiteralPath (Join-Path $AlertDirectory 'latest-offsite-backup-status.json') -Encoding utf8
    Write-Host 'Offsite backup complete.'
    Write-Host "[OK] $(Split-Path $dbZip -Leaf) - $((Get-Item $dbZip).Length) bytes"
    Write-Host "[OK] $(Split-Path $storageZip -Leaf) - $((Get-Item $storageZip).Length) bytes"
    Write-Host "[OK] $(Split-Path $manifestPath -Leaf)"
    Write-Host "Destination: $destination"
}
finally {
    if (Test-Path -LiteralPath $runRoot -PathType Container) { Remove-Item -LiteralPath $runRoot -Recurse -Force }
}
