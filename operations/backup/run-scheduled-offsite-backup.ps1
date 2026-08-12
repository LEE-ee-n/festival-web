[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$DriveRoot,
    [ValidateRange(1, 90)][int]$KeepDays = 7,
    [string]$AlertDirectory = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'FestibomOperations\alerts')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$exportScript = Join-Path $PSScriptRoot 'Export-FestibomOffsiteBackup.ps1'
$notificationScript = Join-Path $repositoryRoot 'operations\alerts\Send-FestibomOperationAlert.ps1'

try {
    & $exportScript -DriveRoot $DriveRoot -KeepDays $KeepDays -AlertDirectory $AlertDirectory
    exit 0
}
catch {
    New-Item -ItemType Directory -Path $AlertDirectory -Force | Out-Null
    $record = [ordered]@{ occurred_at = (Get-Date).ToUniversalTime().ToString('o'); task = 'Festibom Offsite Backup'; status = 'failure'; message = $_.Exception.Message } | ConvertTo-Json
    $record | Set-Content -LiteralPath (Join-Path $AlertDirectory 'latest-offsite-backup-status.json') -Encoding utf8
    if (Test-Path -LiteralPath $notificationScript -PathType Leaf) {
        try { & $notificationScript -Severity failure -Message "Google Drive backup failed: $($_.Exception.Message)" -AlertDirectory $AlertDirectory } catch { }
    }
    exit 1
}
