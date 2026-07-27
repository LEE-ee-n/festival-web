$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$projectRoot = (Resolve-Path (Join-Path $root '..\..')).Path
$secretDir = Join-Path $root 'work\secrets'
$logDir = Join-Path $root 'work\logs'
$logPath = Join-Path $logDir ("bot-{0}.log" -f (Get-Date -Format 'yyyy-MM-dd'))

New-Item -ItemType Directory -Path $logDir -Force | Out-Null

function Write-RunLog([string]$Message) {
  $line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-ddTHH:mm:ss.fffK'), $Message
  Write-Host $line
  Add-Content -LiteralPath $logPath -Value $line -Encoding utf8
}

function Read-Secret([string]$Name) {
  $path = Join-Path $secretDir "$Name.dpapi"
  if (-not (Test-Path -LiteralPath $path)) { throw "Missing secret: $Name. Run scripts\save-config.ps1 first." }
  $secure = ConvertTo-SecureString ((Get-Content -LiteralPath $path -Raw).Trim())
  return [System.Net.NetworkCredential]::new('', $secure).Password
}

$env:DISCORD_BOT_TOKEN = Read-Secret 'discord-token'
$env:DISCORD_ALLOWED_USER_ID = Read-Secret 'discord-user-id'
$env:SUPABASE_URL = Read-Secret 'supabase-url'
$env:SUPABASE_ANON_KEY = Read-Secret 'supabase-anon-key'
$env:SUPABASE_BOT_EMAIL = Read-Secret 'supabase-bot-email'
$env:SUPABASE_BOT_PASSWORD = Read-Secret 'supabase-bot-password'
$env:FESTIVAL_CRAWLER_ROOT = Join-Path $projectRoot 'crawler-output\ticket-discovery'
$env:FESTIBOM_ADMIN_BASE_URL = 'https://festibom.com'

if (-not $env:INSTAGRAM_CHROME_PATH) {
  $env:INSTAGRAM_CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
}
if (-not $env:INSTAGRAM_PROFILE_PATH) {
  $env:INSTAGRAM_PROFILE_PATH = Join-Path $root 'work\instagram-chrome-profile'
}

Set-Location -LiteralPath $root
try {
  Write-RunLog "Bot launcher starting. Log: $logPath"
  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  & 'C:\Program Files\nodejs\npm.cmd' start 2>&1 | ForEach-Object {
    $line = $_.ToString()
    Write-Host $line
    Add-Content -LiteralPath $logPath -Value $line -Encoding utf8
  }
  $exitCode = $LASTEXITCODE
  $ErrorActionPreference = $previousErrorActionPreference
  Write-RunLog "Bot process stopped. Exit code: $exitCode"
  if ($exitCode -ne 0) {
    throw "Bot process failed with exit code $exitCode."
  }
} catch {
  Write-RunLog "Bot launcher failed: $($_.Exception.Message)"
  throw
} finally {
  'DISCORD_BOT_TOKEN','DISCORD_ALLOWED_USER_ID','SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_BOT_EMAIL','SUPABASE_BOT_PASSWORD','FESTIVAL_CRAWLER_ROOT' |
    ForEach-Object { Remove-Item "Env:\$_" -ErrorAction SilentlyContinue }
}
