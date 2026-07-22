$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$secretDir = Join-Path $root 'work\secrets'

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

if (-not $env:INSTAGRAM_CHROME_PATH) {
  $env:INSTAGRAM_CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
}
if (-not $env:INSTAGRAM_PROFILE_PATH) {
  $env:INSTAGRAM_PROFILE_PATH = Join-Path $root 'work\instagram-chrome-profile'
}

Set-Location -LiteralPath $root
try {
  & 'C:\Program Files\nodejs\npm.cmd' start
} finally {
  'DISCORD_BOT_TOKEN','DISCORD_ALLOWED_USER_ID','SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_BOT_EMAIL','SUPABASE_BOT_PASSWORD' |
    ForEach-Object { Remove-Item "Env:\$_" -ErrorAction SilentlyContinue }
}
