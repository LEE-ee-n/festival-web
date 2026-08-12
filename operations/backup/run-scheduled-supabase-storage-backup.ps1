[CmdletBinding()]
param(
  [ValidateNotNullOrEmpty()]
  [string]$Destination = (Join-Path ([Environment]::GetFolderPath("MyDocuments")) "FestibomOperations\backups\storage"),
  [ValidateNotNullOrEmpty()]
  [string]$AlertDirectory = (Join-Path ([Environment]::GetFolderPath("MyDocuments")) "FestibomOperations\alerts")
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$backupScript = Join-Path $PSScriptRoot "run-supabase-storage-backup.ps1"
$healthScript = Join-Path $PSScriptRoot "Test-FestibomStorageBackup.ps1"
$notificationScript = Join-Path $repositoryRoot "operations\alerts\Send-FestibomOperationAlert.ps1"
$mutex = [System.Threading.Mutex]::new($false, "Local\FestibomSupabaseStorageBackup")
$hasMutex = $false
$logPath = $null

function Write-StatusRecord {
  param([string]$Status, [string]$Message)
  New-Item -ItemType Directory -Path $AlertDirectory -Force | Out-Null
  $record = [ordered]@{ occurred_at = (Get-Date).ToUniversalTime().ToString("o"); task = "Festibom Supabase Storage Backup"; status = $Status; message = $Message; log_path = $script:logPath } | ConvertTo-Json
  $record | Set-Content -LiteralPath (Join-Path $AlertDirectory "latest-storage-backup-status.json") -Encoding utf8
  $record | Set-Content -LiteralPath (Join-Path $AlertDirectory ("storage-backup-{0}-{1}.json" -f (Get-Date -Format "yyyyMMdd-HHmmss"), $Status)) -Encoding utf8
}

try {
  $hasMutex = $mutex.WaitOne(0)
  if (-not $hasMutex) { throw "Another Storage backup is already running." }
  $logDirectory = Join-Path $Destination "logs"
  New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
  $logPath = Join-Path $logDirectory ("scheduled-{0}.log" -f (Get-Date -Format "yyyyMMdd-HHmmss"))
  & powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $backupScript -Destination $Destination *>&1 | Tee-Object -FilePath $logPath
  if ($LASTEXITCODE -ne 0) { throw "Storage backup subprocess failed. See $logPath" }
  & powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $healthScript -Destination $Destination *>&1 | Tee-Object -FilePath $logPath -Append
  if ($LASTEXITCODE -ne 0) { throw "Storage backup verification failed. See $logPath" }
  Write-StatusRecord -Status "success" -Message "Storage backup and SHA-256 verification completed."
  exit 0
}
catch {
  if ($null -ne $logPath) { Add-Content -LiteralPath $logPath -Value "ERROR: $($_.Exception.Message)" -Encoding utf8 }
  Write-StatusRecord -Status "failure" -Message $_.Exception.Message
  if (Test-Path -LiteralPath $notificationScript -PathType Leaf) {
    try {
      & $notificationScript -Severity failure -Message "Storage 백업 실패: $($_.Exception.Message)" -AlertDirectory $AlertDirectory
    }
    catch {
      if ($null -ne $logPath) { Add-Content -LiteralPath $logPath -Value "Notification error: $($_.Exception.Message)" -Encoding utf8 }
    }
  }
  exit 1
}
finally {
  if ($hasMutex) { $mutex.ReleaseMutex() }
  $mutex.Dispose()
}
