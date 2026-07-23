$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$botRoot = Join-Path $projectRoot 'operations\discord-instagram-bot'
$secretDirectory = Join-Path $botRoot 'work\secrets'

function Read-DpapiSecret([string]$Name) {
  $path = Join-Path $secretDirectory "$Name.dpapi"
  if (-not (Test-Path -LiteralPath $path)) {
    throw "Missing Discord Bot DPAPI secret: $Name"
  }
  $secure = ConvertTo-SecureString ((Get-Content -LiteralPath $path -Raw).Trim())
  return [System.Net.NetworkCredential]::new('', $secure).Password
}

$env:FESTIVAL_CRAWLER_ROOT = Join-Path $projectRoot 'crawler-output\ticket-discovery'
$env:DISCORD_WEBHOOK_FILE = Join-Path $env:FESTIVAL_CRAWLER_ROOT 'discord-webhook-url.txt'
$env:SUPABASE_URL = Read-DpapiSecret 'supabase-url'
$env:SUPABASE_ANON_KEY = Read-DpapiSecret 'supabase-anon-key'
$env:SUPABASE_BOT_EMAIL = Read-DpapiSecret 'supabase-bot-email'
$env:SUPABASE_BOT_PASSWORD = Read-DpapiSecret 'supabase-bot-password'
$logDirectory = Join-Path $env:FESTIVAL_CRAWLER_ROOT 'reports'
New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
$runLog = Join-Path $logDirectory 'latest-run.log'

Set-Location -LiteralPath $projectRoot
try {
  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  & 'C:\Program Files\nodejs\npm.cmd' run crawler:report 2>&1 |
    Tee-Object -FilePath $runLog
  $ErrorActionPreference = $previousErrorActionPreference
  if ($LASTEXITCODE -ne 0) { throw "Ticket discovery report failed with exit code $LASTEXITCODE." }
} finally {
  'SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_BOT_EMAIL','SUPABASE_BOT_PASSWORD',
  'FESTIVAL_CRAWLER_ROOT','DISCORD_WEBHOOK_FILE' |
    ForEach-Object { Remove-Item "Env:\$_" -ErrorAction SilentlyContinue }
}
