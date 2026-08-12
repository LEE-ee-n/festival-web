[CmdletBinding()]
param(
    [string]$BackupRoot = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'FestibomOperations\backups\db'),
    [string]$AlertDirectory = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'FestibomOperations\alerts'),
    [ValidateRange(1, 168)][int]$MaximumAgeHours = 26,
    [ValidateRange(1, 3650)][int]$RetentionDays = 35,
    [ValidateRange(1, 1024)][int]$MinimumFreeSpaceGb = 5
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$problems = [System.Collections.Generic.List[string]]::new()
$warnings = [System.Collections.Generic.List[string]]::new()
$latestBackup = $null
$latestAgeHours = $null
$oldBackupCount = 0
$verifiedFiles = [System.Collections.Generic.List[object]]::new()

function Add-Problem {
    param([Parameter(Mandatory)][string]$Message)
    $script:problems.Add($Message)
}

try {
    if (-not (Test-Path -LiteralPath $BackupRoot -PathType Container)) {
        Add-Problem "백업 폴더가 없습니다: $BackupRoot"
    } else {
        $backups = @(Get-ChildItem -LiteralPath $BackupRoot -Directory -Filter 'festibom-*' |
            Sort-Object LastWriteTimeUtc -Descending)

        if ($backups.Count -eq 0) {
            Add-Problem 'DB 백업이 한 건도 없습니다.'
        } else {
            $latestBackup = $backups[0]
            $latestAgeHours = [math]::Round(((Get-Date).ToUniversalTime() - $latestBackup.LastWriteTimeUtc).TotalHours, 1)
            if ($latestAgeHours -gt $MaximumAgeHours) {
                Add-Problem "최신 DB 백업이 $latestAgeHours 시간 전입니다. 허용 기준은 $MaximumAgeHours 시간입니다."
            }

            $retentionCutoff = (Get-Date).ToUniversalTime().AddDays(-$RetentionDays)
            $oldBackupCount = @($backups | Where-Object { $_.LastWriteTimeUtc -lt $retentionCutoff }).Count
            if ($oldBackupCount -gt 0) {
                $warnings.Add("보관 기준 $RetentionDays 일을 지난 백업이 $oldBackupCount 건 있습니다. 검토 후 수동 정리하세요.")
            }

            $manifestPath = Join-Path $latestBackup.FullName 'manifest.json'
            if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
                Add-Problem "최신 백업에 manifest.json이 없습니다: $($latestBackup.FullName)"
            } else {
                $manifestFileInfo = Get-Item -LiteralPath $manifestPath
                if ($manifestFileInfo.Length -le 0) {
                    Add-Problem "최신 백업의 manifest.json이 비어 있습니다: $manifestPath"
                } else {
                    $verifiedFiles.Add([pscustomobject]@{
                        Name = 'manifest.json'
                        Bytes = $manifestFileInfo.Length
                        Verification = 'exists'
                    })
                }
                $manifest = Get-Content -Raw -Encoding utf8 -LiteralPath $manifestPath | ConvertFrom-Json
                $requiredNames = @('roles.sql', 'schema.sql', 'data.sql')
                $manifestNames = @($manifest.files | ForEach-Object { [string]$_.name })
                foreach ($requiredName in $requiredNames) {
                    if ($requiredName -notin $manifestNames) {
                        Add-Problem "최신 백업 manifest에 필수 파일이 없습니다: $requiredName"
                    }
                }
                foreach ($manifestFile in @($manifest.files)) {
                    $filePath = Join-Path $latestBackup.FullName ([string]$manifestFile.name)
                    if (-not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
                        Add-Problem "최신 백업 파일이 없습니다: $filePath"
                        continue
                    }
                    $file = Get-Item -LiteralPath $filePath
                    if ($file.Length -le 0) {
                        Add-Problem "최신 백업 파일이 비어 있습니다: $filePath"
                        continue
                    }
                    $actualHash = (Get-FileHash -LiteralPath $filePath -Algorithm SHA256).Hash.ToLowerInvariant()
                    $expectedHash = ([string]$manifestFile.sha256).ToLowerInvariant()
                    if ($actualHash -ne $expectedHash) {
                        Add-Problem "최신 백업 파일의 SHA-256이 일치하지 않습니다: $filePath"
                    } else {
                        $verifiedFiles.Add([pscustomobject]@{
                            Name = $file.Name
                            Bytes = $file.Length
                            Verification = 'SHA-256 matched'
                        })
                    }
                }
            }
        }

        $resolvedRoot = (Resolve-Path -LiteralPath $BackupRoot).Path
        $driveId = [System.IO.Path]::GetPathRoot($resolvedRoot).TrimEnd('\')
        $drive = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='$driveId'"
        if ($null -ne $drive -and $null -ne $drive.FreeSpace) {
            $freeSpaceGb = [math]::Round($drive.FreeSpace / 1GB, 1)
            if ($freeSpaceGb -lt $MinimumFreeSpaceGb) {
                Add-Problem "백업 드라이브 여유 공간이 $freeSpaceGb GB입니다. 최소 기준은 $MinimumFreeSpaceGb GB입니다."
            }
        }
    }
}
catch {
    Add-Problem $_.Exception.Message
}

New-Item -ItemType Directory -Path $AlertDirectory -Force | Out-Null
$status = if ($problems.Count -eq 0) { 'success' } else { 'failure' }
$record = [ordered]@{
    checked_at = (Get-Date).ToUniversalTime().ToString('o')
    task = 'Festibom DB Backup Health Check'
    status = $status
    backup_root = $BackupRoot
    latest_backup = if ($null -eq $latestBackup) { $null } else { $latestBackup.FullName }
    latest_age_hours = $latestAgeHours
    maximum_age_hours = $MaximumAgeHours
    retention_days = $RetentionDays
    old_backup_count = $oldBackupCount
    problems = @($problems)
    warnings = @($warnings)
}
$json = $record | ConvertTo-Json -Depth 5
$json | Set-Content -LiteralPath (Join-Path $AlertDirectory 'latest-backup-health.json') -Encoding utf8
$json | Set-Content -LiteralPath (Join-Path $AlertDirectory ("backup-health-{0}-{1}.json" -f (Get-Date -Format 'yyyyMMdd-HHmmss'), $status)) -Encoding utf8

if ($status -eq 'failure') {
    Write-Error ($problems -join [Environment]::NewLine)
    exit 1
}

Write-Host 'DB backup health: OK'
Write-Host "Backup directory: $($latestBackup.FullName)"
Write-Host 'Required backup files:'
foreach ($file in @($verifiedFiles | Sort-Object Name)) {
    Write-Host ("[OK] {0} - {1:N0} bytes - {2}" -f $file.Name, $file.Bytes, $file.Verification)
}
if ($warnings.Count -gt 0) {
    $warnings | ForEach-Object { Write-Warning $_ }
}
exit 0
