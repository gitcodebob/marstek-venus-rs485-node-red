<#
.SYNOPSIS
    Interactive commit + optional version bump + optional push.

.DESCRIPTION
    Walks the user through the commit workflow with prompts at each decision
    point. For a non-interactive variant suitable for scripting or AI
    orchestration, see commit-push.ps1.

    Prompts cover:
      - Version bump type (none / patch / minor / major)
      - Commit message
      - Files Changed list confirmation (for the release-notes section)
      - Confirm before commit
      - Confirm before push

    The deterministic mechanics (running check.ps1, running bump-version.ps1,
    writing RELEASE_NOTES.md, staging, committing, pushing) are identical to
    the non-interactive script.

.PARAMETER DryRun
    Print every action but perform no writes, commits, or pushes.

.EXAMPLE
    # Windows / pwsh
    .\contribute\commit-push-interactive.ps1
    .\contribute\commit-push-interactive.ps1 -DryRun
#>

[CmdletBinding()]
param(
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ROOT = Resolve-Path (Join-Path $PSScriptRoot '..')

# ─────────────────────────────────────────────────────────────────────────────
# Helpers (same shape as commit-push.ps1)
# ─────────────────────────────────────────────────────────────────────────────
function Write-Step { param([string]$m) Write-Host "  [STEP] $m" -ForegroundColor Cyan }
function Write-Action { param([string]$m) Write-Host "  [DO  ] $m" -ForegroundColor Green }
function Write-DryAction { param([string]$m) Write-Host "  [DRY ] $m" -ForegroundColor Yellow }
function Write-Fail { param([string]$m) Write-Host "  [FAIL] $m" -ForegroundColor Red }

function Invoke-OrDryRun {
    param([string]$Label, [scriptblock]$Block)
    if ($DryRun) { Write-DryAction $Label } else { Write-Action $Label; & $Block }
}

function Read-Choice {
    param([string]$Prompt, [string[]]$Choices, [string]$Default)
    $hint = ($Choices | ForEach-Object { if ($_ -eq $Default) { $_.ToUpper() } else { $_ } }) -join '/'
    while ($true) {
        $a = Read-Host "$Prompt ($hint)"
        if (-not $a) { return $Default }
        $a = $a.ToLower()
        if ($a -in $Choices) { return $a }
        Write-Host "  Please enter one of: $($Choices -join ', ')" -ForegroundColor Yellow
    }
}

function Read-YesNo {
    param([string]$Prompt, [bool]$Default = $false)
    $hint = if ($Default) { 'Y/n' } else { 'y/N' }
    while ($true) {
        $a = Read-Host "$Prompt [$hint]"
        if (-not $a) { return $Default }
        switch ($a.ToLower()) {
            { $_ -in 'y', 'yes' } { return $true }
            { $_ -in 'n', 'no' } { return $false }
            default { Write-Host "  Please answer y or n" -ForegroundColor Yellow }
        }
    }
}

function Test-VersionLabelOnlyChange {
    param([string]$Path)
    $diff = git diff HEAD -- $Path 2>$null
    if (-not $diff) { return $false }
    foreach ($line in ($diff -split "`r?`n")) {
        if ($line -match '^(diff |index |--- |\+\+\+ |@@|\\ No newline)') { continue }
        if ($line.Length -eq 0) { continue }
        $first = $line[0]
        if ($first -ne '+' -and $first -ne '-') { continue }
        $content = $line.Substring(1)
        if ($content -notmatch 'v\d+\.\d+\.\d+') { return $false }
    }
    return $true
}

function Get-PorcelainStatus {
    $out = @()
    foreach ($line in (git status --porcelain)) {
        if (-not $line -or $line.Length -lt 4) { continue }
        $status = $line.Substring(0, 2)
        $path = $line.Substring(3)
        if ($path -match ' -> ') { $path = ($path -split ' -> ')[1] }
        $path = $path.Trim('"')
        $out += [pscustomobject]@{ Status = $status; Path = $path }
    }
    $out
}

function Get-DefaultFilesChanged {
    $files = @()
    foreach ($entry in (Get-PorcelainStatus)) {
        $path = $entry.Path
        $status = $entry.Status
        $norm = $path -replace '\\', '/'
        if ($status -match 'D') { continue }
        if ($norm -match '^\.claude/') { continue }
        if ($norm -match '^\.github/') { continue }
        if ($norm -match '^docs/') { continue }
        if ($norm -eq 'README.md') { continue }
        if ($norm -eq 'RELEASE_NOTES.md') { continue }
        if ($norm -match '^notes/') { continue }
        if ($norm -eq 'home assistant/dashboard.yaml') { $files += $path; continue }
        if ($norm -match '^node-red/') {
            $isUntracked = $status -match '\?'
            if (-not $isUntracked -and (Test-VersionLabelOnlyChange $path)) { continue }
            $files += $path
            continue
        }
        $files += $path
    }
    $files | Sort-Object -Unique
}

function Update-ReleaseNotes {
    param([string]$Version, [string]$BulletMessage, [string[]]$Files)

    $rnPath = Join-Path $ROOT 'RELEASE_NOTES.md'
    $rnRaw = Get-Content $rnPath -Raw -Encoding UTF8

    if ($rnRaw -match "(?m)^## $([regex]::Escape($Version))\b") {
        Write-Host "  RELEASE_NOTES.md already has '## $Version' - leaving as is" -ForegroundColor Yellow
        return
    }

    # Format matches the convention used by earlier releases: a bold headline
    # per change with indented '*' sub-bullets. The script emits only the bold
    # headline; user adds details before publishing.
    $section = @()
    $section += "## $Version"
    $section += "- **$BulletMessage**"
    $section += ""
    $section += "- **Files Changed:**"
    foreach ($f in $Files) { $section += "  - ``$f``" }
    $section += ""
    $sectionText = ($section -join "`n") + "`n"

    $re = [regex]"(?m)^## \d+\.\d+\.\d+\b"
    if (-not $re.IsMatch($rnRaw)) {
        Write-Fail "RELEASE_NOTES.md has no '## x.y.z' heading to anchor against"
        exit 1
    }
    $newRn = $re.Replace($rnRaw, ($sectionText + '$&'), 1)

    Invoke-OrDryRun "Write RELEASE_NOTES.md with new '## $Version' section" {
        $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::WriteAllText($rnPath, $newRn, $utf8NoBom)
    }
}

function Invoke-ChildScript {
    param([string]$ScriptName, [hashtable]$ScriptArgs = @{})
    $path = Join-Path $PSScriptRoot $ScriptName
    & $path @ScriptArgs
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "$ScriptName exited with code $LASTEXITCODE"
        return $false
    }
    return $true
}

# ─────────────────────────────────────────────────────────────────────────────
# Banner + current status
# ─────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "=====================================================" -ForegroundColor White
Write-Host "  commit-push (interactive)$(if ($DryRun) { ' DRY RUN' })" -ForegroundColor White
Write-Host "=====================================================" -ForegroundColor White
Write-Host ""

Write-Step "Current working tree:"
git status --short
Write-Host ""

if (-not (Get-PorcelainStatus)) {
    Write-Fail "No changes to commit. Nothing to do."
    exit 1
}

# ─────────────────────────────────────────────────────────────────────────────
# 1. Initial check
# ─────────────────────────────────────────────────────────────────────────────
Write-Step "Running check.ps1"
if (-not (Invoke-ChildScript 'check.ps1')) {
    if (-not (Read-YesNo "check.ps1 failed. Continue anyway?")) { exit 1 }
}

# ─────────────────────────────────────────────────────────────────────────────
# 2. Decide on version bump
# ─────────────────────────────────────────────────────────────────────────────
$bumpType = Read-Choice -Prompt "Version bump?" -Choices @('none', 'patch', 'minor', 'major') -Default 'none'

# ─────────────────────────────────────────────────────────────────────────────
# 3. Commit message
# ─────────────────────────────────────────────────────────────────────────────
$message = ''
while (-not $message) {
    $message = (Read-Host "Commit message").Trim()
    if (-not $message) { Write-Host "  Message cannot be empty." -ForegroundColor Yellow }
}

# ─────────────────────────────────────────────────────────────────────────────
# 4. Apply bump (if requested)
# ─────────────────────────────────────────────────────────────────────────────
$newVersion = $null
if ($bumpType -ne 'none') {
    Write-Step "Bumping version: $bumpType"
    $bumpArgs = @{ Type = $bumpType }
    if ($DryRun) { $bumpArgs.DryRun = $true }
    if (-not (Invoke-ChildScript 'bump-version.ps1' $bumpArgs)) {
        if (-not (Read-YesNo "bump-version.ps1 failed. Continue anyway?")) { exit 1 }
    }

    if (-not $DryRun) {
        Write-Step "Re-running check.ps1 after bump"
        if (-not (Invoke-ChildScript 'check.ps1')) {
            if (-not (Read-YesNo "check.ps1 failed after bump. Continue anyway?")) { exit 1 }
        }
    }

    $startFile = Join-Path $ROOT 'node-red/01 start-flow.json'
    $startJson = Get-Content $startFile -Raw -Encoding UTF8 | ConvertFrom-Json
    $startLabel = @($startJson)[0].label
    if ($startLabel -match 'v(\d+\.\d+\.\d+)') {
        $newVersion = $matches[1]
        Write-Host "  Current version after bump: v$newVersion" -ForegroundColor Green
    }
    else {
        Write-Fail "Could not read new version from 01 start-flow.json"
        exit 1
    }

    # ─── Files Changed list ──────────────────────────────────────────────
    $filesChanged = @(Get-DefaultFilesChanged)

    Write-Step "Proposed 'Files Changed' for release notes:"
    foreach ($f in $filesChanged) { Write-Host "    - $f" -ForegroundColor White }
    Write-Host ""

    if (-not (Read-YesNo "Use this list as-is?" -Default $true)) {
        Write-Host "  Enter the file list (one path per line, blank line to finish):" -ForegroundColor Cyan
        $manual = @()
        while ($true) {
            $line = Read-Host "  "
            if (-not $line) { break }
            $manual += $line.Trim()
        }
        $filesChanged = $manual
    }

    Update-ReleaseNotes -Version $newVersion -BulletMessage $message -Files $filesChanged
}

# ─────────────────────────────────────────────────────────────────────────────
# 5. Stage + confirm + commit
# ─────────────────────────────────────────────────────────────────────────────
Write-Step "Staging changes"
Invoke-OrDryRun "git add -A" {
    git add -A
    if ($LASTEXITCODE -ne 0) { throw "git add failed" }
}

Write-Step "git status after staging:"
git status --short
Write-Host ""

if (-not (Read-YesNo "Commit with message:`n    `"$message`"`n?" -Default $true)) {
    Write-Host "  Aborted before commit. Staged files remain staged." -ForegroundColor Yellow
    exit 0
}

Write-Step "Committing"
Invoke-OrDryRun "git commit -m `"$message`"" {
    git commit -m $message
    if ($LASTEXITCODE -ne 0) { throw "git commit failed" }
}

# ─────────────────────────────────────────────────────────────────────────────
# 6. Push
# ─────────────────────────────────────────────────────────────────────────────
if (Read-YesNo "Push to origin now?" -Default $false) {
    Write-Step "Pushing to origin"
    # '-u origin HEAD' so the first push on a new branch sets upstream.
    Invoke-OrDryRun "git push -u origin HEAD" {
        git push -u origin HEAD
        if ($LASTEXITCODE -ne 0) { throw "git push failed" }
    }
}

Write-Host ""
Write-Host "=====================================================" -ForegroundColor White
Write-Host "  Done.$(if ($DryRun) { ' (dry run - nothing was written)' })" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor White
Write-Host ""
