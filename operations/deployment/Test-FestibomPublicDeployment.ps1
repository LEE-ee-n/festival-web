[CmdletBinding()]
param(
    [string]$BaseUrl = 'https://festibom.com',
    [ValidateRange(5, 120)][int]$TimeoutSeconds = 30,
    [string]$OperationsRoot = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'FestibomOperations'
    )
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$base = $BaseUrl.TrimEnd('/')
$checks = @(
    @{ Path = '/'; Expected = 200; Contains = 'Festibom' },
    @{ Path = '/festivals'; Expected = 200; Contains = '' },
    @{ Path = '/artists'; Expected = 200; Contains = '' },
    @{ Path = '/login'; Expected = 200; Contains = 'Google' },
    @{ Path = '/privacy'; Expected = 200; Contains = '' },
    @{ Path = '/report'; Expected = 200; Contains = 'festibom.official@gmail.com' },
    @{ Path = '/sitemap.xml'; Expected = 200; Contains = '<urlset' },
    @{ Path = '/robots.txt'; Expected = 200; Contains = 'Sitemap:' },
    @{ Path = '/festival/999999'; Expected = 404; Contains = '' },
    @{ Path = '/artist/999999'; Expected = 404; Contains = '' }
)

$results = [Collections.Generic.List[object]]::new()
foreach ($check in $checks) {
    $url = "$base$($check.Path)"
    $status = $null
    $message = $null
    $passed = $false
    try {
        $response = Invoke-WebRequest -Uri $url -MaximumRedirection 5 -TimeoutSec $TimeoutSeconds -UseBasicParsing -ErrorAction Stop
        $status = [int]$response.StatusCode
        $contentPassed = [string]::IsNullOrWhiteSpace($check.Contains) -or $response.Content.Contains([string]$check.Contains)
        $passed = $status -eq $check.Expected -and $contentPassed
        if (-not $contentPassed) { $message = "Required text was not found: $($check.Contains)" }
    }
    catch {
        if ($null -ne $_.Exception.Response) { $status = [int]$_.Exception.Response.StatusCode }
        $passed = $status -eq $check.Expected
        if (-not $passed) { $message = $_.Exception.Message }
    }
    $results.Add([pscustomobject]@{ url = $url; expected = $check.Expected; actual = $status; passed = $passed; message = $message })
    Write-Host "[$(if($passed){'OK'}else{'FAIL'})] $status $url"
}

$failed = @($results | Where-Object { -not $_.passed })
$reportDirectory = Join-Path $OperationsRoot 'deployments'
New-Item -ItemType Directory -Path $reportDirectory -Force | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$reportPath = Join-Path $reportDirectory "$stamp-public-smoke-test.json"
[ordered]@{
    checked_at = (Get-Date).ToUniversalTime().ToString('o')
    base_url = $base
    status = if ($failed.Count -eq 0) { 'success' } else { 'failure' }
    checks = @($results)
} | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $reportPath -Encoding utf8

Write-Host "Report: $reportPath"
if ($failed.Count -gt 0) { throw "Public deployment check failed: $($failed.Count) check(s)." }
Write-Host 'Public deployment check: OK'
