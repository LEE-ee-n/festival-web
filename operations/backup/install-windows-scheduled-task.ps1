[CmdletBinding()]
param(
  [ValidateNotNullOrEmpty()]
  [string]$Destination = (Join-Path ([Environment]::GetFolderPath("MyDocuments")) "FestibomOperations\backups\db"),

  [ValidateNotNullOrEmpty()]
  [string]$AlertDirectory = (Join-Path ([Environment]::GetFolderPath("MyDocuments")) "FestibomOperations\alerts"),

  [ValidatePattern("^(?:[01]\d|2[0-3]):[0-5]\d$")]
  [string]$DailyAt = "21:00",

  [ValidateNotNullOrEmpty()]
  [string]$TaskName = "Festibom Supabase DB Backup"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function ConvertTo-XmlText {
  param(
    [Parameter(Mandatory)]
    [string]$Value
  )

  return $Value.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;").Replace('"', "&quot;").Replace("'", "&apos;")
}

$scheduledBackupScript = Join-Path $PSScriptRoot "run-scheduled-supabase-db-backup.ps1"
if (-not (Test-Path -LiteralPath $scheduledBackupScript -PathType Leaf)) {
  throw "Scheduled backup script was not found: $scheduledBackupScript"
}

$currentIdentity = (& whoami.exe).Trim()
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($currentIdentity)) {
  throw "The current Windows user could not be identified."
}

$startBoundary = "{0}T{1}:00" -f (Get-Date -Format "yyyy-MM-dd"), $DailyAt
$arguments = "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$scheduledBackupScript`" -Destination `"$Destination`" -AlertDirectory `"$AlertDirectory`""
$escapedIdentity = ConvertTo-XmlText -Value $currentIdentity
$escapedStartBoundary = ConvertTo-XmlText -Value $startBoundary
$escapedArguments = ConvertTo-XmlText -Value $arguments
$escapedWorkingDirectory = ConvertTo-XmlText -Value $PSScriptRoot
$taskXmlPath = Join-Path ([System.IO.Path]::GetTempPath()) ("festibom-scheduled-task-{0}.xml" -f [guid]::NewGuid().ToString("N"))

$taskXml = @"
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.4" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>Backs up Festibom Supabase roles, schema, and data, then verifies SHA-256 hashes.</Description>
  </RegistrationInfo>
  <Triggers>
    <CalendarTrigger>
      <StartBoundary>$escapedStartBoundary</StartBoundary>
      <Enabled>true</Enabled>
      <ScheduleByDay>
        <DaysInterval>1</DaysInterval>
      </ScheduleByDay>
    </CalendarTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <UserId>$escapedIdentity</UserId>
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>LeastPrivilege</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>true</RunOnlyIfNetworkAvailable>
    <IdleSettings>
      <StopOnIdleEnd>false</StopOnIdleEnd>
      <RestartOnIdle>false</RestartOnIdle>
    </IdleSettings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT2H</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>powershell.exe</Command>
      <Arguments>$escapedArguments</Arguments>
      <WorkingDirectory>$escapedWorkingDirectory</WorkingDirectory>
    </Exec>
  </Actions>
</Task>
"@

try {
  Set-Content -LiteralPath $taskXmlPath -Value $taskXml -Encoding Unicode
  & schtasks.exe /Create /TN $TaskName /XML $taskXmlPath /F
  if ($LASTEXITCODE -ne 0) {
    throw "schtasks.exe failed to register the task with exit code $LASTEXITCODE."
  }
}
finally {
  if (Test-Path -LiteralPath $taskXmlPath -PathType Leaf) {
    Remove-Item -LiteralPath $taskXmlPath -Force
  }
}

Write-Host "Windows scheduled task registered."
Write-Host "Task: $TaskName"
Write-Host "User: $currentIdentity"
Write-Host "Daily at: $DailyAt"
Write-Host "Destination: $Destination"
Write-Host "Status records: $AlertDirectory"
& schtasks.exe /Query /TN $TaskName /FO LIST
