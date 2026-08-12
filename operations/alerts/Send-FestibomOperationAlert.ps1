[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateSet('failure', 'warning', 'success', 'test')]
    [string]$Severity,

    [Parameter(Mandatory)]
    [ValidateNotNullOrEmpty()]
    [string]$Message,

    [string]$AlertDirectory = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'FestibomOperations\alerts'),

    [ValidateRange(5, 300)]
    [int]$TimeoutSeconds = 60,

    [string]$Title = '',

    [switch]$NoPopup
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

New-Item -ItemType Directory -Path $AlertDirectory -Force | Out-Null
$occurredAt = Get-Date
$defaultTitle = switch ($Severity) {
    'failure' { 'Festibom backup failed' }
    'warning' { 'Festibom backup needs attention' }
    'success' { 'Festibom backup is healthy' }
    default { 'Festibom alert test' }
}
$title = if ([string]::IsNullOrWhiteSpace($Title)) { $defaultTitle } else { $Title }
$icon = if ($Severity -eq 'failure') { 16 } elseif ($Severity -eq 'warning') { 48 } else { 64 }
$popupShown = $false
$popupError = $null

if (-not $NoPopup) {
    try {
        $shell = New-Object -ComObject WScript.Shell
        $null = $shell.Popup($Message, $TimeoutSeconds, $title, $icon)
        $popupShown = $true
    }
    catch {
        $popupError = $_.Exception.Message
    }
}

$record = [ordered]@{
    occurred_at = $occurredAt.ToUniversalTime().ToString('o')
    severity = $Severity
    title = $title
    message = $Message
    popup_requested = -not $NoPopup
    popup_shown = $popupShown
    popup_error = $popupError
}
$json = $record | ConvertTo-Json -Depth 3
$stamp = $occurredAt.ToString('yyyyMMdd-HHmmss')
$json | Set-Content -LiteralPath (Join-Path $AlertDirectory "notification-$stamp-$Severity.json") -Encoding utf8
$json | Set-Content -LiteralPath (Join-Path $AlertDirectory 'latest-notification.json') -Encoding utf8

Write-Host "${title}: $Message"
if ($null -ne $popupError) {
    Write-Warning "Windows popup could not be displayed: $popupError"
}
