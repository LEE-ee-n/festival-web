[CmdletBinding()]
param(
  [ValidateNotNullOrEmpty()]
  [string]$Destination = (Join-Path ([Environment]::GetFolderPath("MyDocuments")) "FestibomOperations\backups\db"),

  [ValidateNotNullOrEmpty()]
  [string]$AlertDirectory = (Join-Path ([Environment]::GetFolderPath("MyDocuments")) "FestibomOperations\alerts"),

  [ValidateRange(30, 600)]
  [int]$DockerReadyTimeoutSeconds = 180
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$backupScript = Join-Path $PSScriptRoot "run-supabase-db-backup.ps1"
$notificationScript = Join-Path $repositoryRoot "operations\alerts\Send-FestibomOperationAlert.ps1"
$mutex = [System.Threading.Mutex]::new($false, "Local\FestibomSupabaseDbBackup")
$hasMutex = $false
$logPath = $null
$backupDirectoryPath = $null

function Write-BackupLog {
  param(
    [Parameter(Mandatory)]
    [string]$Message
  )

  $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Message
  Write-Host $line
  if ($null -ne $script:logPath) {
    Add-Content -LiteralPath $script:logPath -Value $line -Encoding utf8
  }
}

function Write-BackupStatus {
  param(
    [Parameter(Mandatory)]
    [ValidateSet("success", "failure")]
    [string]$Status,

    [Parameter(Mandatory)]
    [string]$Message
  )

  if (-not (Test-Path -LiteralPath $AlertDirectory)) {
    New-Item -ItemType Directory -Path $AlertDirectory -Force | Out-Null
  }

  $statusRecord = [ordered]@{
    occurred_at = (Get-Date).ToUniversalTime().ToString("o")
    task = "Festibom Supabase DB Backup"
    status = $Status
    message = $Message
    backup_directory = $script:backupDirectoryPath
    log_path = $script:logPath
  }

  $statusJson = $statusRecord | ConvertTo-Json -Depth 3
  $historyPath = Join-Path $AlertDirectory ("backup-{0}-{1}.json" -f (Get-Date -Format "yyyyMMdd-HHmmss"), $Status)
  $latestPath = Join-Path $AlertDirectory "latest-backup-status.json"
  $statusJson | Set-Content -LiteralPath $historyPath -Encoding utf8
  $statusJson | Set-Content -LiteralPath $latestPath -Encoding utf8
}

function Get-DockerCliPath {
  $dockerCommand = Get-Command "docker.exe" -ErrorAction SilentlyContinue
  if ($null -ne $dockerCommand) {
    return $dockerCommand.Source
  }

  $bundledDockerCli = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"
  if (Test-Path -LiteralPath $bundledDockerCli -PathType Leaf) {
    return $bundledDockerCli
  }

  throw "Docker CLI was not found. Install Docker Desktop first."
}

function Test-DockerEngineReady {
  param(
    [Parameter(Mandatory)]
    [string]$DockerCli
  )

  try {
    & $DockerCli info --format "{{.ServerVersion}}" 2>$null | Out-Null
    return $LASTEXITCODE -eq 0
  }
  catch {
    # Docker Desktop이 설치되어 있어도 엔진이 꺼져 있으면 docker info가
    # PowerShell 오류를 발생시킬 수 있다. 이 경우 실패로 종료하지 않고
    # Wait-DockerEngine에서 Docker Desktop을 시작하도록 false를 반환한다.
    return $false
  }
}

function Wait-DockerEngine {
  param(
    [Parameter(Mandatory)]
    [string]$DockerCli,

    [Parameter(Mandatory)]
    [int]$TimeoutSeconds
  )

  if (Test-DockerEngineReady -DockerCli $DockerCli) {
    Write-BackupLog "Docker engine is ready."
    return
  }

  $dockerDesktop = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
  if (-not (Test-Path -LiteralPath $dockerDesktop -PathType Leaf)) {
    throw "Docker Desktop executable was not found: $dockerDesktop"
  }

  Write-BackupLog "Docker engine is not ready. Starting Docker Desktop."
  Start-Process -FilePath $dockerDesktop -WindowStyle Hidden | Out-Null

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 5
    if (Test-DockerEngineReady -DockerCli $DockerCli) {
      Write-BackupLog "Docker engine became ready."
      return
    }
  }

  throw "Docker engine did not become ready within $TimeoutSeconds seconds."
}

function Assert-BackupManifest {
  param(
    [Parameter(Mandatory)]
    [string]$BackupDirectory
  )

  $manifestPath = Join-Path $BackupDirectory "manifest.json"
  if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
    throw "Backup manifest was not created: $manifestPath"
  }

  $manifest = Get-Content -Raw -Encoding utf8 -LiteralPath $manifestPath | ConvertFrom-Json
  $manifestFiles = @($manifest.files)
  if ($manifestFiles.Count -ne 3) {
    throw "Backup manifest must contain exactly three SQL files."
  }

  foreach ($manifestFile in $manifestFiles) {
    $fileName = [string]$manifestFile.name
    if ($fileName -notin @("roles.sql", "schema.sql", "data.sql")) {
      throw "Unexpected file in backup manifest: $fileName"
    }

    $filePath = Join-Path $BackupDirectory $fileName
    if (-not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
      throw "Backup output file was not created: $filePath"
    }

    $file = Get-Item -LiteralPath $filePath
    if ($file.Length -le 0) {
      throw "Backup output file is empty: $filePath"
    }

    $actualHash = (Get-FileHash -LiteralPath $filePath -Algorithm SHA256).Hash.ToLowerInvariant()
    $expectedHash = ([string]$manifestFile.sha256).ToLowerInvariant()
    if ($actualHash -ne $expectedHash) {
      throw "Backup hash mismatch: $filePath"
    }

    Write-BackupLog ("Verified {0}: {1:N0} bytes, SHA-256 matched." -f $fileName, $file.Length)
  }
}

try {
  $hasMutex = $mutex.WaitOne(0)
  if (-not $hasMutex) {
    throw "Another Festibom backup is already running."
  }

  if (-not (Test-Path -LiteralPath $backupScript -PathType Leaf)) {
    throw "Backup script was not found: $backupScript"
  }

  if (-not (Test-Path -LiteralPath $Destination)) {
    New-Item -ItemType Directory -Path $Destination -Force | Out-Null
  }

  $resolvedDestination = (Resolve-Path -LiteralPath $Destination).Path
  $logDirectory = Join-Path $resolvedDestination "logs"
  New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
  $logPath = Join-Path $logDirectory ("scheduled-{0}.log" -f (Get-Date -Format "yyyyMMdd-HHmmss"))

  Write-BackupLog "Scheduled Festibom backup started."
  Write-BackupLog "Repository: $repositoryRoot"
  Write-BackupLog "Destination: $resolvedDestination"

  $dockerCli = Get-DockerCliPath
  Wait-DockerEngine -DockerCli $dockerCli -TimeoutSeconds $DockerReadyTimeoutSeconds

  $backupStartedAtUtc = (Get-Date).ToUniversalTime()
  $childLogSuffix = Get-Date -Format "yyyyMMdd-HHmmss"
  $childOutputPath = Join-Path $logDirectory "backup-$childLogSuffix-output.log"
  $childErrorPath = Join-Path $logDirectory "backup-$childLogSuffix-error.log"
  $childArguments = "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$backupScript`" -Destination `"$resolvedDestination`""
  $backupProcess = Start-Process `
    -FilePath "powershell.exe" `
    -ArgumentList $childArguments `
    -WindowStyle Hidden `
    -Wait `
    -PassThru `
    -RedirectStandardOutput $childOutputPath `
    -RedirectStandardError $childErrorPath

  if ($backupProcess.ExitCode -ne 0) {
    throw "Backup subprocess failed with exit code $($backupProcess.ExitCode). See $childOutputPath and $childErrorPath"
  }

  $backupDirectory = Get-ChildItem -LiteralPath $resolvedDestination -Directory |
    Where-Object {
      $_.Name -like "festibom-*" -and
      $_.CreationTimeUtc -ge $backupStartedAtUtc.AddSeconds(-5)
    } |
    Sort-Object CreationTimeUtc -Descending |
    Select-Object -First 1

  if ($null -eq $backupDirectory) {
    throw "The completed backup directory could not be identified."
  }

  Assert-BackupManifest -BackupDirectory $backupDirectory.FullName
  $backupDirectoryPath = $backupDirectory.FullName
  Write-BackupLog "Scheduled Festibom backup completed successfully."
  Write-BackupLog "Backup directory: $($backupDirectory.FullName)"
  Write-BackupStatus -Status "success" -Message "Database backup and SHA-256 verification completed."
  exit 0
}
catch {
  Write-BackupLog "ERROR: $($_.Exception.Message)"
  Write-BackupStatus -Status "failure" -Message $_.Exception.Message
  if (Test-Path -LiteralPath $notificationScript -PathType Leaf) {
    try {
      & $notificationScript -Severity failure -Message "DB 백업 실패: $($_.Exception.Message)" -AlertDirectory $AlertDirectory
    }
    catch {
      Write-BackupLog "Backup failure notification could not be displayed: $($_.Exception.Message)"
    }
  }
  exit 1
}
finally {
  if ($hasMutex) {
    $mutex.ReleaseMutex()
  }
  $mutex.Dispose()
}
