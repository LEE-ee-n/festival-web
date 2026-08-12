[CmdletBinding()]
param(
  [ValidateNotNullOrEmpty()]
  [string]$Destination = (Join-Path ([Environment]::GetFolderPath("MyDocuments")) "FestibomOperations\backups\storage"),
  [ValidateRange(1, 168)]
  [int]$MaximumAgeHours = 26
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$snapshotRoot = Join-Path $Destination "snapshots"
$latestSnapshot = Get-ChildItem -LiteralPath $snapshotRoot -Directory -ErrorAction Stop |
  Where-Object { $_.Name -like "festibom-*" -and $_.Name -notlike "*.tmp" } |
  Sort-Object Name -Descending | Select-Object -First 1
if ($null -eq $latestSnapshot) { throw "No completed Storage backup snapshot was found: $snapshotRoot" }
$manifestPath = Join-Path $latestSnapshot.FullName "manifest.json"
$manifest = Get-Content -Raw -Encoding utf8 -LiteralPath $manifestPath | ConvertFrom-Json
$createdAt = [DateTimeOffset]::Parse([string]$manifest.created_at)
if ([DateTimeOffset]::UtcNow - $createdAt -gt [TimeSpan]::FromHours($MaximumAgeHours)) { throw "Latest Storage backup is older than $MaximumAgeHours hours: $($createdAt.ToString('o'))" }

$verifiedCount = 0
$verifiedBytes = [int64]0
foreach ($object in @($manifest.objects)) {
  $blobPath = Join-Path $Destination ([string]$object.blob_path).Replace('/', [System.IO.Path]::DirectorySeparatorChar)
  if (-not (Test-Path -LiteralPath $blobPath -PathType Leaf)) { throw "Storage backup blob is missing: $blobPath" }
  $actualHash = (Get-FileHash -LiteralPath $blobPath -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($actualHash -ne ([string]$object.sha256).ToLowerInvariant()) { throw "Storage backup hash mismatch: $blobPath" }
  $verifiedCount += 1
  $verifiedBytes += [int64]$object.bytes
}
Write-Host "Storage backup health: OK"
Write-Host "Snapshot: $($latestSnapshot.FullName)"
Write-Host "Buckets: $($manifest.bucket_count)"
Write-Host "Objects verified: $verifiedCount"
Write-Host ("Logical bytes: {0:N0}" -f $verifiedBytes)
Write-Host "All object SHA-256 hashes matched."
