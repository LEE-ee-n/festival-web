[CmdletBinding()]
param(
  [Parameter(Mandatory)]
  [ValidateNotNullOrEmpty()]
  [string]$Destination
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Invoke-SupabaseCli {
  param(
    [Parameter(Mandatory)]
    [string[]]$Arguments
  )

  & $script:SupabaseCli @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Supabase CLI failed with exit code: $LASTEXITCODE"
  }
}

$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$SupabaseCli = Join-Path $repositoryRoot "node_modules\.bin\supabase.cmd"
$projectRef = "cljzrgjatdnefiogedmz"

if (-not (Test-Path -LiteralPath $SupabaseCli -PathType Leaf)) {
  throw "Supabase CLI was not found. Run npm install from the repository root first."
}

if (-not (Test-Path -LiteralPath $Destination)) {
  New-Item -ItemType Directory -Path $Destination -Force | Out-Null
}

$resolvedDestination = (Resolve-Path -LiteralPath $Destination).Path
$pathSeparators = [char[]]@(
  [System.IO.Path]::DirectorySeparatorChar,
  [System.IO.Path]::AltDirectorySeparatorChar
)
$normalizedRepositoryRoot = [System.IO.Path]::GetFullPath($repositoryRoot).TrimEnd($pathSeparators)
$normalizedDestination = [System.IO.Path]::GetFullPath($resolvedDestination).TrimEnd($pathSeparators)
if (
  $normalizedDestination -ieq $normalizedRepositoryRoot -or
  $normalizedDestination.StartsWith("$normalizedRepositoryRoot\\", [System.StringComparison]::OrdinalIgnoreCase)
) {
  throw "The backup destination must be outside the Git repository. Example: C:\FestibomBackups"
}

$backupName = "festibom-" + (Get-Date -Format "yyyyMMdd-HHmmss")
$backupDirectory = Join-Path $resolvedDestination $backupName
if (Test-Path -LiteralPath $backupDirectory) {
  throw "A backup directory already exists for this timestamp: $backupDirectory"
}

New-Item -ItemType Directory -Path $backupDirectory | Out-Null

$rolesPath = Join-Path $backupDirectory "roles.sql"
$schemaPath = Join-Path $backupDirectory "schema.sql"
$dataPath = Join-Path $backupDirectory "data.sql"
$manifestPath = Join-Path $backupDirectory "manifest.json"
$cliWorkRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("festibom-backup-" + [guid]::NewGuid().ToString("N"))
$cliProjectStateDirectory = Join-Path $cliWorkRoot "supabase\.temp"
$linkedProjectStateDirectory = Join-Path $repositoryRoot "supabase\.temp"

if (-not (Test-Path -LiteralPath $linkedProjectStateDirectory -PathType Container)) {
  throw "Linked Supabase project state was not found. Run supabase link --project-ref $projectRef first."
}

New-Item -ItemType Directory -Path $cliProjectStateDirectory -Force | Out-Null
Get-ChildItem -LiteralPath $linkedProjectStateDirectory -File | Copy-Item -Destination $cliProjectStateDirectory -Force

try {
  Write-Host "[1/4] Backing up database roles."
  Invoke-SupabaseCli -Arguments @("--workdir", $cliWorkRoot, "db", "dump", "--linked", "--file", $rolesPath, "--role-only")

  Write-Host "[2/4] Backing up the database schema."
  Invoke-SupabaseCli -Arguments @("--workdir", $cliWorkRoot, "db", "dump", "--linked", "--file", $schemaPath)

  Write-Host "[3/4] Backing up database data, including Auth users and Storage metadata."
  Invoke-SupabaseCli -Arguments @(
    "--workdir", $cliWorkRoot,
    "db", "dump",
    "--linked",
    "--data-only",
    "--use-copy",
    "--exclude", "storage.buckets_vectors",
    "--exclude", "storage.vector_indexes",
    "--file", $dataPath
  )
}
finally {
  if (Test-Path -LiteralPath $cliWorkRoot) {
    Remove-Item -LiteralPath $cliWorkRoot -Recurse -Force
  }
}

foreach ($requiredFile in @($rolesPath, $schemaPath, $dataPath)) {
  if (-not (Test-Path -LiteralPath $requiredFile -PathType Leaf)) {
    throw "Backup output file was not created: $requiredFile"
  }
}

$fileDetails = @($rolesPath, $schemaPath, $dataPath) | ForEach-Object {
  $file = Get-Item -LiteralPath $_
  $hash = Get-FileHash -LiteralPath $_ -Algorithm SHA256

  [ordered]@{
    name = $file.Name
    bytes = $file.Length
    sha256 = $hash.Hash.ToLowerInvariant()
  }
}

$manifest = [ordered]@{
  created_at = (Get-Date).ToUniversalTime().ToString("o")
  source = "Supabase linked project"
  scope = [ordered]@{
    included = @(
      "database roles",
      "database schema",
      "database data including Auth users and Storage metadata"
    )
    excluded = @(
      "Storage object files",
      "Supabase secrets and project settings"
    )
  }
  files = $fileDetails
}

$manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $manifestPath -Encoding utf8

Write-Host "[4/4] Backup complete."
Write-Host "Directory: $backupDirectory"
Write-Host "Next: copy this directory to Drive or an external disk."
