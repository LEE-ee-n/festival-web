[CmdletBinding()]
param(
  [ValidateNotNullOrEmpty()]
  [string]$StorageBackupRoot = (Join-Path ([Environment]::GetFolderPath("MyDocuments")) "FestibomOperations\backups\storage"),

  [ValidateNotNullOrEmpty()]
  [string]$ResultDirectory = (Join-Path ([Environment]::GetFolderPath("MyDocuments")) "FestibomOperations\restore-tests"),

  [ValidateRange(1, 10)]
  [int]$SampleCount = 3
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$nodeScript = Join-Path $PSScriptRoot "test-supabase-storage-restore.mjs"
if (-not (Test-Path -LiteralPath $nodeScript -PathType Leaf)) {
  throw "Storage restore test script was not found: $nodeScript"
}

Push-Location $repositoryRoot
try {
  & node.exe $nodeScript $StorageBackupRoot $ResultDirectory $SampleCount
  if ($LASTEXITCODE -ne 0) {
    throw "Storage restore test failed with exit code $LASTEXITCODE."
  }
}
finally {
  Pop-Location
}
