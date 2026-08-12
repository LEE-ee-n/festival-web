[CmdletBinding()]
param(
  [ValidateNotNullOrEmpty()]
  [string]$Destination = (Join-Path ([Environment]::GetFolderPath("MyDocuments")) "FestibomOperations\backups\storage")
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$nodeScript = Join-Path $PSScriptRoot "backup-supabase-storage.mjs"
if (-not (Test-Path -LiteralPath $nodeScript -PathType Leaf)) { throw "Storage backup script was not found: $nodeScript" }
if (-not (Test-Path -LiteralPath $Destination)) { New-Item -ItemType Directory -Path $Destination -Force | Out-Null }
Push-Location $repositoryRoot
try {
  & node.exe $nodeScript $Destination
  if ($LASTEXITCODE -ne 0) { throw "Storage backup failed with exit code $LASTEXITCODE." }
}
finally { Pop-Location }
