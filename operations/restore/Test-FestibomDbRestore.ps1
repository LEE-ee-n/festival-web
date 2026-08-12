[CmdletBinding()]
param(
    [string]$BackupRoot = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'FestibomOperations\backups\db'),
    [string]$RestoreRoot = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'FestibomOperations\restore-tests')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$startedAt = Get-Date
$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$supabaseCli = Join-Path $repositoryRoot 'node_modules\.bin\supabase.cmd'
$dockerCli = 'C:\Program Files\Docker\Docker\resources\bin\docker.exe'
$restoreId = 'festibom-restore-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
$workDirectory = Join-Path $RestoreRoot $restoreId
$localStackAttempted = $false

$countTargets = [ordered]@{
    auth_users = 'auth.users'
    auth_identities = 'auth.identities'
    festivals = 'public.festivals'
    artists = 'public.artists'
    favorite_artists = 'public.user_favorite_artists'
    schedule_items = 'public.user_schedule_items'
    festival_diaries = 'public.user_festival_diaries'
    storage_objects = 'storage.objects'
}

function Invoke-CheckedCommand {
    param(
        [Parameter(Mandatory)][string]$FilePath,
        [Parameter(Mandatory)][string[]]$Arguments
    )
    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$FilePath failed with exit code $LASTEXITCODE"
    }
}

function Get-BackupCopyRowCounts {
    param(
        [Parameter(Mandatory)][string]$DataSqlPath,
        [Parameter(Mandatory)][System.Collections.IDictionary]$Targets
    )

    $tableToKey = @{}
    foreach ($entry in $Targets.GetEnumerator()) {
        $tableToKey[$entry.Value] = $entry.Key
    }

    $counts = [ordered]@{}
    foreach ($key in $Targets.Keys) {
        $counts[$key] = 0
    }

    $activeKey = $null
    $reader = [System.IO.StreamReader]::new($DataSqlPath, [System.Text.Encoding]::UTF8, $true)
    try {
        while (($line = $reader.ReadLine()) -ne $null) {
            if ($null -eq $activeKey) {
                if ($line -match '^COPY\s+"([^"]+)"\."([^"]+)"\s+.*FROM stdin;$') {
                    $tableName = "$($matches[1]).$($matches[2])"
                    if ($tableToKey.ContainsKey($tableName)) {
                        $activeKey = $tableToKey[$tableName]
                    }
                }
                continue
            }

            if ($line -eq '\.') {
                $activeKey = $null
                continue
            }

            $counts[$activeKey] = [int64]$counts[$activeKey] + 1
        }
    }
    finally {
        $reader.Dispose()
    }

    return [pscustomobject]$counts
}

if (-not (Test-Path -LiteralPath $supabaseCli -PathType Leaf)) {
    throw 'Supabase CLI was not found. Run npm install first.'
}
if (-not (Test-Path -LiteralPath $dockerCli -PathType Leaf)) {
    throw 'Docker Desktop was not found.'
}

$backupRootPath = [System.IO.Path]::GetFullPath($BackupRoot).TrimEnd('\')
$latestBackup = Get-ChildItem -LiteralPath $backupRootPath -Directory -Filter 'festibom-*' |
    Sort-Object LastWriteTimeUtc -Descending |
    Select-Object -First 1
if ($null -eq $latestBackup) {
    throw "No backup was found: $backupRootPath"
}

$requiredFiles = @('roles.sql', 'schema.sql', 'data.sql', 'manifest.json')
foreach ($requiredFile in $requiredFiles) {
    $requiredPath = Join-Path $latestBackup.FullName $requiredFile
    if (-not (Test-Path -LiteralPath $requiredPath -PathType Leaf)) {
        throw "Required backup file is missing: $requiredPath"
    }
}

$manifestPath = Join-Path $latestBackup.FullName 'manifest.json'
$manifest = Get-Content -Raw -Encoding utf8 -LiteralPath $manifestPath | ConvertFrom-Json
Write-Host 'Verifying source backup files before restore.'
foreach ($manifestFile in $manifest.files) {
    $sourcePath = Join-Path $latestBackup.FullName ([string]$manifestFile.name)
    if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
        throw "Manifest file is missing: $sourcePath"
    }

    $fileInfo = Get-Item -LiteralPath $sourcePath
    $actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $sourcePath).Hash.ToLowerInvariant()
    $expectedHash = ([string]$manifestFile.sha256).ToLowerInvariant()
    if ($fileInfo.Length -ne [int64]$manifestFile.bytes -or $actualHash -ne $expectedHash) {
        throw "Backup integrity verification failed: $($manifestFile.name)"
    }
    Write-Host "[OK] $($manifestFile.name) - $($fileInfo.Length) bytes - SHA-256 matched"
}

$expectedCounts = Get-BackupCopyRowCounts `
    -DataSqlPath (Join-Path $latestBackup.FullName 'data.sql') `
    -Targets $countTargets

if (Get-NetTCPConnection -LocalPort 54322 -State Listen -ErrorAction SilentlyContinue) {
    throw 'Local port 54322 is already in use. Stop the other local Supabase stack before this restore test.'
}

& $dockerCli info --format '{{.ServerVersion}}' | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw 'Docker Desktop is not running.'
}

New-Item -ItemType Directory -Path $workDirectory -Force | Out-Null
$reportPath = Join-Path $workDirectory 'restore-report.json'

try {
    Write-Host "[1/5] Creating isolated Supabase work directory: $workDirectory"
    Invoke-CheckedCommand -FilePath $supabaseCli -Arguments @('--workdir', $workDirectory, 'init')

    $configPath = Join-Path $workDirectory 'supabase\config.toml'
    $config = Get-Content -Raw -Encoding utf8 -LiteralPath $configPath
    $config = [regex]::Replace($config, 'project_id\s*=\s*"[^"]+"', "project_id = `"$restoreId`"", 1)
    $utf8WithoutBom = [System.Text.UTF8Encoding]::new($false)
    [System.IO.File]::WriteAllText($configPath, $config, $utf8WithoutBom)

    $postgresVersionSource = Join-Path $repositoryRoot 'supabase\.temp\postgres-version'
    if (Test-Path -LiteralPath $postgresVersionSource -PathType Leaf) {
        $versionTargetDirectory = Join-Path $workDirectory 'supabase\.temp'
        New-Item -ItemType Directory -Path $versionTargetDirectory -Force | Out-Null
        Copy-Item -LiteralPath $postgresVersionSource -Destination (Join-Path $versionTargetDirectory 'postgres-version') -Force
    }

    Write-Host '[2/5] Starting isolated local Supabase stack.'
    $localStackAttempted = $true
    Invoke-CheckedCommand -FilePath $supabaseCli -Arguments @('--workdir', $workDirectory, 'start')

    $containerName = "supabase_db_$restoreId"
    $runningContainer = & $dockerCli ps --filter "name=^/$containerName$" --format '{{.Names}}'
    if ($LASTEXITCODE -ne 0 -or $runningContainer.Trim() -ne $containerName) {
        throw "Restore database container was not found: $containerName"
    }

    Write-Host '[3/5] Copying backup files into the isolated database container.'
    foreach ($sqlFile in @('roles.sql', 'schema.sql', 'data.sql')) {
        Invoke-CheckedCommand -FilePath $dockerCli -Arguments @('cp', (Join-Path $latestBackup.FullName $sqlFile), "${containerName}:/tmp/$sqlFile")
    }

    Write-Host '[4/5] Restoring roles, schema, and data.'
    Invoke-CheckedCommand -FilePath $dockerCli -Arguments @(
        'exec', $containerName,
        'psql',
        '--single-transaction',
        '--variable', 'ON_ERROR_STOP=1',
        '--username', 'postgres',
        '--dbname', 'postgres',
        '--file', '/tmp/roles.sql',
        '--file', '/tmp/schema.sql',
        '--command', 'SET session_replication_role = replica;',
        '--file', '/tmp/data.sql'
    )

    Write-Host '[5/5] Verifying restored row counts.'
    $countSql = @'
select json_build_object(
  'auth_users', (select count(*) from auth.users),
  'auth_identities', (select count(*) from auth.identities),
  'festivals', (select count(*) from public.festivals),
  'artists', (select count(*) from public.artists),
  'favorite_artists', (select count(*) from public.user_favorite_artists),
  'schedule_items', (select count(*) from public.user_schedule_items),
  'festival_diaries', (select count(*) from public.user_festival_diaries),
  'storage_objects', (select count(*) from storage.objects)
)::text;
'@
    $countsJson = (& $dockerCli exec $containerName psql --tuples-only --no-align --username postgres --dbname postgres --command $countSql).Trim()
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($countsJson)) {
        throw 'Restored row count verification failed.'
    }
    $counts = $countsJson | ConvertFrom-Json
    foreach ($key in $countTargets.Keys) {
        $expected = [int64]$expectedCounts.$key
        $actual = [int64]$counts.$key
        if ($actual -ne $expected) {
            throw "Restore row count mismatch: $key expected $expected, actual $actual"
        }
    }

    $report = [ordered]@{
        tested_at = (Get-Date).ToUniversalTime().ToString('o')
        status = 'success'
        source_backup = $latestBackup.FullName
        isolated_work_directory = $workDirectory
        duration_minutes = [math]::Round(((Get-Date) - $startedAt).TotalMinutes, 1)
        expected_row_counts = $expectedCounts
        row_counts = $counts
    }
    $report | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $reportPath -Encoding utf8

    Write-Host 'Restore test: OK'
    Write-Host "Source backup: $($latestBackup.FullName)"
    Write-Host "Duration: $($report.duration_minutes) minutes"
    Write-Host 'Restored row counts (all matched the backup):'
    Write-Host "[OK] Auth users: $($counts.auth_users)"
    Write-Host "[OK] Auth identities: $($counts.auth_identities)"
    Write-Host "[OK] Festivals: $($counts.festivals)"
    Write-Host "[OK] Artists: $($counts.artists)"
    Write-Host "[OK] Favorite artists: $($counts.favorite_artists)"
    Write-Host "[OK] Schedule items: $($counts.schedule_items)"
    Write-Host "[OK] Festival diaries: $($counts.festival_diaries)"
    Write-Host "[OK] Storage metadata: $($counts.storage_objects)"
    Write-Host "Report: $reportPath"
}
finally {
    if ($localStackAttempted) {
        Write-Host 'Stopping isolated local Supabase stack. Restore files are preserved for review.'
        & $supabaseCli --workdir $workDirectory stop --no-backup | Out-Null
    }
}
