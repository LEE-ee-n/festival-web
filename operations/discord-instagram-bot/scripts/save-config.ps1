$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$secretDir = Join-Path $root 'work\secrets'
New-Item -ItemType Directory -Force -Path $secretDir | Out-Null

function Save-Secret([string]$Name, [string]$Prompt, [bool]$Hidden = $true) {
  if ($Hidden) {
    $value = Read-Host $Prompt -AsSecureString
  } else {
    $plain = (Read-Host $Prompt).Trim()
    if (-not $plain) { throw "$Name is required." }
    $value = ConvertTo-SecureString $plain -AsPlainText -Force
  }
  $value | ConvertFrom-SecureString | Set-Content -LiteralPath (Join-Path $secretDir "$Name.dpapi")
}

Save-Secret 'discord-token' 'Discord Bot Token'
Save-Secret 'discord-user-id' 'Allowed Discord user ID' $false
Save-Secret 'supabase-url' 'Supabase project URL' $false
Save-Secret 'supabase-anon-key' 'Supabase anon/publishable key'
Save-Secret 'supabase-bot-email' 'Supabase Bot account email' $false
Save-Secret 'supabase-bot-password' 'Supabase Bot account password'

Write-Host 'DPAPI 설정 저장 완료' -ForegroundColor Green
