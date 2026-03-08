<#
.SYNOPSIS
    Validates the project for consistency before committing or releasing.

.DESCRIPTION
    Runs a series of checks:
      1. JSON validity       - Every node-red/*.json must parse without errors.
      2. Node count          - Each flow file must contain >= 5 nodes.
      3. Version consistency - All versioned flow files and dashboard.yaml must
                               share the same version as 01 start-flow.json.
      4. Combined file sync  - Every tab label from individual flow files must
                               exist in all-flows-in-one-file.json.
      5. Release notes       - RELEASE_NOTES.md must have a section for the
                               current version.

    Exits with code 0 on success, 1 on any failure.

.EXAMPLE
    # Windows (PowerShell 5 or pwsh)
    .\contribute\check.ps1

    # macOS / Linux (pwsh)
    ./contribute/check.ps1
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ROOT = Resolve-Path (Join-Path $PSScriptRoot '..')
$NR = Join-Path $ROOT 'node-red'

$pass = $true
$warns = [System.Collections.Generic.List[string]]::new()
$errs = [System.Collections.Generic.List[string]]::new()

function Write-Check { param([string]$msg) Write-Host "  [CHECK] $msg" -ForegroundColor Cyan }
function Write-Pass { param([string]$msg) Write-Host "  [ OK  ] $msg" -ForegroundColor Green }
function Write-Fail { param([string]$msg) Write-Host "  [FAIL ] $msg" -ForegroundColor Red; $script:pass = $false; $script:errs.Add($msg) }
function Write-Warn { param([string]$msg) Write-Host "  [WARN ] $msg" -ForegroundColor Yellow; $script:warns.Add($msg) }

Write-Host ""
Write-Host "=====================================================" -ForegroundColor White
Write-Host "  Project Check                                       " -ForegroundColor White
Write-Host "=====================================================" -ForegroundColor White
Write-Host ""

# ─────────────────────────────────────────────────────────────────────────────
# 1. JSON validity + 2. Node count
# ─────────────────────────────────────────────────────────────────────────────
Write-Host "--- 1 & 2: JSON validity and node count ---" -ForegroundColor White

$flowFiles = Get-ChildItem (Join-Path $NR '*.json') | Where-Object { $_.Name -ne 'all-flows-in-one-file.json' }

foreach ($file in $flowFiles) {
    Write-Check $file.Name

    # JSON validity
    $json = $null
    try {
        $raw = Get-Content $file.FullName -Raw
        $json = $raw | ConvertFrom-Json
    }
    catch {
        Write-Fail "$($file.Name): invalid JSON - $_"
        continue
    }
    Write-Pass "$($file.Name): valid JSON"

    # Node count (skip the two master/presets files that are structural-only)
    $nodeCount = @($json).Count
    if ($nodeCount -lt 5) {
        Write-Fail "$($file.Name): only $nodeCount nodes (expected >= 5)"
    }
    else {
        Write-Pass "$($file.Name): $nodeCount nodes"
    }
}

# Also validate all-flows-in-one-file.json
Write-Check 'all-flows-in-one-file.json'
try {
    $allFlowsRaw = Get-Content (Join-Path $NR 'all-flows-in-one-file.json') -Raw
    $allFlowsJson = $allFlowsRaw | ConvertFrom-Json
    $allFlowsCount = @($allFlowsJson).Count
    Write-Pass "all-flows-in-one-file.json: valid JSON - $allFlowsCount nodes"
}
catch {
    Write-Fail "all-flows-in-one-file.json: invalid JSON - $_"
    $allFlowsJson = $null
}

Write-Host ""

# ─────────────────────────────────────────────────────────────────────────────
# 3. Version consistency
# ─────────────────────────────────────────────────────────────────────────────
Write-Host "--- 3: Version consistency ---" -ForegroundColor White

$startFile = Join-Path $NR '01 start-flow.json'
$startJson = Get-Content $startFile -Raw | ConvertFrom-Json
$startLabel = @($startJson)[0].label   # e.g. "Home Battery Start v4.5.2"

if ($startLabel -match 'v(\d+\.\d+\.\d+)') {
    $currentVersion = $matches[1]
    Write-Pass "Authoritative version from 01 start-flow.json: v$currentVersion"
}
else {
    Write-Fail "Could not parse version from 01 start-flow.json label: '$startLabel'"
    $currentVersion = $null
}

if ($currentVersion) {
    # Check all 02 strategy files
    $strategyFiles = Get-ChildItem (Join-Path $NR '02 strategy-*.json')
    foreach ($file in $strategyFiles) {
        $json = Get-Content $file.FullName -Raw | ConvertFrom-Json
        $label = @($json)[0].label
        if ($label -match 'v(\d+\.\d+\.\d+)') {
            $fileVersion = $matches[1]
            if ($fileVersion -eq $currentVersion) {
                Write-Pass "$($file.Name): v$fileVersion"
            }
            else {
                Write-Fail "$($file.Name): version mismatch - found v$fileVersion, expected v$currentVersion"
            }
        }
        else {
            Write-Warn "$($file.Name): no version pattern found in label '$label'"
        }
    }

    # Check dashboard.yaml
    $dashPath = Join-Path (Join-Path $ROOT 'home assistant') 'dashboard.yaml'
    $dashContent = Get-Content $dashPath -Raw
    $dashPattern = [regex]"Home Battery Control \*\(v(\d+\.\d+\.\d+)\)\*"
    $dashMatch = $dashPattern.Match($dashContent)
    if ($dashMatch.Success) {
        $dashVersion = $dashMatch.Groups[1].Value
        if ($dashVersion -eq $currentVersion) {
            Write-Pass "dashboard.yaml: v$dashVersion"
        }
        else {
            Write-Fail "dashboard.yaml: version mismatch - found v$dashVersion, expected v$currentVersion"
        }
    }
    else {
        Write-Fail "dashboard.yaml: version string 'Home Battery Control *(v<x.y.z>)*' not found"
    }
}

Write-Host ""

# ─────────────────────────────────────────────────────────────────────────────
# 4. all-flows-in-one-file.json sync
# ─────────────────────────────────────────────────────────────────────────────
Write-Host "--- 4: Combined file sync ---" -ForegroundColor White

if ($allFlowsJson) {
    $allTabs = @($allFlowsJson) | Where-Object { $_.type -eq 'tab' } | Select-Object -ExpandProperty label

    foreach ($file in $flowFiles) {
        $json = Get-Content $file.FullName -Raw | ConvertFrom-Json
        $label = @($json)[0].label
        if ($allTabs -contains $label) {
            Write-Pass "$($file.Name): tab '$label' found in combined file"
        }
        else {
            Write-Fail "$($file.Name): tab '$label' NOT found in all-flows-in-one-file.json"
        }
    }
}
else {
    Write-Warn "Skipping combined-file sync check because all-flows-in-one-file.json failed to parse."
}

Write-Host ""

# ─────────────────────────────────────────────────────────────────────────────
# 5. Release notes section
# ─────────────────────────────────────────────────────────────────────────────
Write-Host "--- 5: Release notes ---" -ForegroundColor White

if ($currentVersion) {
    $rnPath = Join-Path $ROOT 'RELEASE_NOTES.md'
    $rnContent = Get-Content $rnPath -Raw
    if ($rnContent -match "(?m)^## $([regex]::Escape($currentVersion))\b") {
        Write-Pass "RELEASE_NOTES.md: section '## $currentVersion' found"
    }
    else {
        Write-Warn "RELEASE_NOTES.md: no section '## $currentVersion' found - add release notes before publishing"
    }
}

Write-Host ""

# ─────────────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────────────
Write-Host "=====================================================" -ForegroundColor White
if ($pass) {
    Write-Host "  RESULT: ALL CHECKS PASSED" -ForegroundColor Green
    if ($warns.Count -gt 0) {
        Write-Host "  Warnings ($($warns.Count)):" -ForegroundColor Yellow
        $warns | ForEach-Object { Write-Host "    - $_" -ForegroundColor Yellow }
    }
    Write-Host "=====================================================" -ForegroundColor White
    Write-Host ""
    exit 0
}
else {
    Write-Host "  RESULT: $($errs.Count) CHECK(S) FAILED" -ForegroundColor Red
    Write-Host "  Errors:" -ForegroundColor Red
    $errs | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
    if ($warns.Count -gt 0) {
        Write-Host "  Warnings ($($warns.Count)):" -ForegroundColor Yellow
        $warns | ForEach-Object { Write-Host "    - $_" -ForegroundColor Yellow }
    }
    Write-Host "=====================================================" -ForegroundColor White
    Write-Host ""
    exit 1
}
