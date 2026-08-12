[CmdletBinding()]
param(
    [ValidateRange(7, 3650)][int]$RetentionDays = 30,
    [ValidateRange(2, 365)][int]$MinimumBackups = 7,
    [string]$AlertDirectory = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'FestibomOperations\alerts')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$cleanupScript = Join-Path $PSScriptRoot 'Invoke-FestibomBackupRetention.ps1'
$notificationScript = Join-Path $repositoryRoot 'operations\alerts\Send-FestibomOperationAlert.ps1'

function Write-RetentionStatus {
    param([ValidateSet('success', 'failure')][string]$Status, [string]$Message)
    New-Item -ItemType Directory -Path $AlertDirectory -Force | Out-Null
    $record = [ordered]@{
        occurred_at = (Get-Date).ToUniversalTime().ToString('o')
        task = 'Festibom Backup Retention'
        status = $Status
        message = $Message
    } | ConvertTo-Json
    $record | Set-Content -LiteralPath (Join-Path $AlertDirectory 'latest-retention-status.json') -Encoding utf8
    $record | Set-Content -LiteralPath (Join-Path $AlertDirectory ("retention-status-{0}-{1}.json" -f (Get-Date -Format 'yyyyMMdd-HHmmss'), $Status)) -Encoding utf8
}

try {
    & $cleanupScript -RetentionDays $RetentionDays -MinimumBackups $MinimumBackups -Confirm:$false
    Write-RetentionStatus -Status success -Message 'Backup retention cleanup completed.'
    exit 0
}
catch {
    Write-RetentionStatus -Status failure -Message $_.Exception.Message
    if (Test-Path -LiteralPath $notificationScript -PathType Leaf) {
        try { & $notificationScript -Severity failure -Message "Backup retention failed: $($_.Exception.Message)" -AlertDirectory $AlertDirectory } catch { }
    }
    exit 1
}
