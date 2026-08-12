[CmdletBinding()]
param(
    [string]$OperationsRoot = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'FestibomOperations'),
    [switch]$SkipBuild
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$deploymentDirectory = Join-Path $OperationsRoot 'deployments'
New-Item -ItemType Directory -Path $deploymentDirectory -Force | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$logPath = Join-Path $deploymentDirectory "$stamp-pre-deploy.log"
$reportPath = Join-Path $deploymentDirectory "$stamp-pre-deploy.json"
$started = Get-Date

function Invoke-CheckedCommand {
    param([Parameter(Mandatory)][string]$Name, [Parameter(Mandatory)][scriptblock]$Command)
    Write-Host "`n=== $Name ==="
    & $Command *>&1 | Tee-Object -FilePath $logPath -Append
    if ($LASTEXITCODE -ne 0) { throw "$Name failed with exit code $LASTEXITCODE." }
}

Push-Location $repositoryRoot
try {
    $status = @(& git status --short)
    $trackedFiles = @(& git ls-files)
    $trackedSensitive = @($trackedFiles | Select-String -Pattern '(^|/)(\.env($|\.)|backups/|operations/private/)|\.(pem|key|p12|pfx|jks|keystore|token|secret|secrets|zip|backup|bak)$|(^|/)(credentials|auth|session)\.json$')
    if ($trackedSensitive.Count -gt 0) { throw "Sensitive or generated files are tracked:`n$($trackedSensitive -join "`n")" }
    $trackedGenerated = @($trackedFiles | Select-String -Pattern '(^|/)supabase/\.temp/')
    if ($trackedGenerated.Count -gt 0) {
        Write-Warning "Generated Supabase files are still tracked and should be removed from Git:`n$($trackedGenerated -join "`n")"
    }

    Invoke-CheckedCommand -Name 'Tests' -Command { & npm.cmd test }
    Invoke-CheckedCommand -Name 'ESLint' -Command { & npm.cmd run lint }
    Invoke-CheckedCommand -Name 'TypeScript' -Command { & npm.cmd run typecheck }
    if (-not $SkipBuild) { Invoke-CheckedCommand -Name 'Production build' -Command { & npm.cmd run build } }

    $result = [ordered]@{
        checked_at = (Get-Date).ToUniversalTime().ToString('o')
        status = 'success'
        commit = (& git rev-parse HEAD).Trim()
        branch = (& git branch --show-current).Trim()
        dirty_file_count = $status.Count
        tracked_generated_file_count = $trackedGenerated.Count
        build_skipped = [bool]$SkipBuild
        duration_seconds = [math]::Round(((Get-Date) - $started).TotalSeconds, 1)
        log = $logPath
    }
    $result | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $reportPath -Encoding utf8
    Write-Host "`nPre-deploy check: OK"
    Write-Host "Changed files: $($status.Count)"
    Write-Host "Report: $reportPath"
}
catch {
    [ordered]@{
        checked_at = (Get-Date).ToUniversalTime().ToString('o')
        status = 'failure'
        message = $_.Exception.Message
        duration_seconds = [math]::Round(((Get-Date) - $started).TotalSeconds, 1)
        log = $logPath
    } | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $reportPath -Encoding utf8
    throw
}
finally { Pop-Location }
