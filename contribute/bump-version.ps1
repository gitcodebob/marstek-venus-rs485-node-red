<#
.SYNOPSIS
    Bumps the SemVer version across all relevant project files.

.DESCRIPTION
    Reads the current version from node-red/01 start-flow.json, calculates
    the new version according to the requested bump type, then updates:
      - node-red/01 start-flow.json              (label)
      - node-red/02 strategy-*.json              (label of first object)
      - node-red/all-flows-in-one-file.json      (all version labels)
      - home assistant/dashboard.yaml            (version string in content card)

    Before bumping, verifies that all-flows-in-one-file.json contains the
    same current version as the individual flow files.

    Use -DryRun to preview all changes without writing any files.

.PARAMETER Type
    The type of version bump: patch, minor, or major.

.PARAMETER DryRun
    Preview changes without writing any files.

.EXAMPLE
    # Windows (PowerShell 5 or pwsh)
    .\contribute\bump-version.ps1 -Type patch
    .\contribute\bump-version.ps1 -Type minor
    .\contribute\bump-version.ps1 -Type major -DryRun

    # macOS / Linux (pwsh)
    ./contribute/bump-version.ps1 -Type patch
    ./contribute/bump-version.ps1 -Type minor -DryRun
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateSet('patch', 'minor', 'major')]
    [string]$Type,

    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ROOT = Resolve-Path (Join-Path $PSScriptRoot '..')
$NR = Join-Path $ROOT 'node-red'

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────
function Write-Action { param([string]$msg) Write-Host "  [UPDATE] $msg" -ForegroundColor Cyan }
function Write-Skip { param([string]$msg) Write-Host "  [SKIP  ] $msg" -ForegroundColor DarkGray }
function Write-DryRun { param([string]$msg) Write-Host "  [DRY   ] $msg" -ForegroundColor Yellow }

# Writes $content to $path, or prints what would happen if -DryRun.
function Save-File {
    param([string]$path, [string]$content)
    $rel = $path.Replace($ROOT.Path, '').TrimStart('\/')
    if ($DryRun) {
        Write-DryRun "Would write: $rel"
    }
    else {
        [System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
        Write-Action $rel
    }
}

# ─────────────────────────────────────────────────────────────────────────────
# Read current version
# ─────────────────────────────────────────────────────────────────────────────
$startFile = Join-Path $NR '01 start-flow.json'
$startRaw = Get-Content $startFile -Raw
$startJson = $startRaw | ConvertFrom-Json
$startLabel = @($startJson)[0].label   # e.g. "Home Battery Start v4.5.2"

if (-not ($startLabel -match 'v(\d+)\.(\d+)\.(\d+)')) {
    Write-Error "Cannot parse version from '01 start-flow.json' label: '$startLabel'"
    exit 1
}

[int]$major = $matches[1]
[int]$minor = $matches[2]
[int]$patch = $matches[3]
$oldVersion = "$major.$minor.$patch"

# Calculate new version
switch ($Type) {
    'major' { $major++; $minor = 0; $patch = 0 }
    'minor' { $minor++; $patch = 0 }
    'patch' { $patch++ }
}
$newVersion = "$major.$minor.$patch"

Write-Host ""
Write-Host "=====================================================" -ForegroundColor White
Write-Host "  Version Bump$(if ($DryRun) { ' (DRY RUN)' })" -ForegroundColor White
Write-Host "=====================================================" -ForegroundColor White
Write-Host ""
Write-Host "  $Type bump: v$oldVersion  -->  v$newVersion" -ForegroundColor $(if ($DryRun) { 'Yellow' } else { 'Green' })
Write-Host ""

# ─────────────────────────────────────────────────────────────────────────────
# Pre-flight: verify all-flows-in-one-file.json has the current version
# ─────────────────────────────────────────────────────────────────────────────
$allFlowsPath = Join-Path $NR 'all-flows-in-one-file.json'
$allFlowsRaw = Get-Content $allFlowsPath -Raw
$allFlowsJson = $allFlowsRaw | ConvertFrom-Json

# Collect versioned tab labels from all-flows-in-one-file.json
$allFlowsTabs = @($allFlowsJson) | Where-Object { $_.type -eq 'tab' -and $_.label -match 'v(\d+\.\d+\.\d+)' }
foreach ($tab in $allFlowsTabs) {
    if ($tab.label -match 'v(\d+\.\d+\.\d+)') {
        $tabVersion = $matches[1]
        if ($tabVersion -ne $oldVersion) {
            Write-Error "all-flows-in-one-file.json tab '$($tab.label)' has version v$tabVersion but expected v$oldVersion. Re-export your flows first."
            exit 1
        }
    }
}
Write-Host "  [ OK  ] all-flows-in-one-file.json: all versioned tabs match v$oldVersion" -ForegroundColor Green
Write-Host ""

# ─────────────────────────────────────────────────────────────────────────────
# Update node-red/01 start-flow.json
# ─────────────────────────────────────────────────────────────────────────────
$newStartRaw = $startRaw -replace "v$([regex]::Escape($oldVersion))", "v$newVersion"
if ($newStartRaw -ne $startRaw) {
    Save-File $startFile $newStartRaw
}
else {
    Write-Skip "01 start-flow.json (no change)"
}

# ─────────────────────────────────────────────────────────────────────────────
# Update node-red/02 strategy-*.json
# ─────────────────────────────────────────────────────────────────────────────
$strategyFiles = Get-ChildItem (Join-Path $NR '02 strategy-*.json')
foreach ($file in $strategyFiles) {
    $raw = Get-Content $file.FullName -Raw
    $new = $raw -replace "v$([regex]::Escape($oldVersion))", "v$newVersion"
    if ($new -ne $raw) {
        Save-File $file.FullName $new
    }
    else {
        Write-Skip "$($file.Name) (no change)"
    }
}

# ─────────────────────────────────────────────────────────────────────────────
# Update node-red/all-flows-in-one-file.json
# ─────────────────────────────────────────────────────────────────────────────
$newAllFlowsRaw = $allFlowsRaw -replace "v$([regex]::Escape($oldVersion))", "v$newVersion"
if ($newAllFlowsRaw -ne $allFlowsRaw) {
    Save-File $allFlowsPath $newAllFlowsRaw
}
else {
    Write-Skip "all-flows-in-one-file.json (no change)"
}

# ─────────────────────────────────────────────────────────────────────────────
# Update home assistant/dashboard.yaml
# ─────────────────────────────────────────────────────────────────────────────
$dashPath = Join-Path (Join-Path $ROOT 'home assistant') 'dashboard.yaml'
$dashRaw = Get-Content $dashPath -Raw
$dashPattern = "Home Battery Control \*\(v$([regex]::Escape($oldVersion))\)\*"
$dashReplace = "Home Battery Control *(v$newVersion)*"
$newDashRaw = $dashRaw -replace $dashPattern, $dashReplace

if ($newDashRaw -ne $dashRaw) {
    Save-File $dashPath $newDashRaw
}
else {
    Write-Skip "home assistant/dashboard.yaml (pattern not found or no change)"
}

# ─────────────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────────────
Write-Host ""
if ($DryRun) {
    Write-Host "  DRY RUN complete - no files were written." -ForegroundColor Yellow
    Write-Host "  Run without -DryRun to apply changes." -ForegroundColor Yellow
}
else {
    Write-Host "  Done. Version bumped from v$oldVersion to v$newVersion." -ForegroundColor Green
    Write-Host "  Remember to:" -ForegroundColor White
    Write-Host "    1. Add a '## $newVersion' section to RELEASE_NOTES.md." -ForegroundColor White
    Write-Host "    2. Run .\contribute\check.ps1 to verify all files are consistent." -ForegroundColor White
}
Write-Host "=====================================================" -ForegroundColor White
Write-Host ""
