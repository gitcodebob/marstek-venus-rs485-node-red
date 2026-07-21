<#
.SYNOPSIS
    Non-interactive commit + optional version bump + optional push.

.DESCRIPTION
    Runs the full commit workflow with every decision passed as a parameter.
    Designed for AI orchestration: the dialogue with the user happens before
    invoking this script; the script then executes deterministically.

    Workflow:
      1. Run check.ps1; halt on failure.
      2. If -VersionBump != 'none':
           a. Run bump-version.ps1 -Type <type>.
           b. Re-run check.ps1 to confirm consistency.
           c. Insert a new '## <new-version>' section in RELEASE_NOTES.md
              (Files Changed list is computed by default or overridden).
      3. Stage all changes except .claude/ (git add -A -- ':!.claude').
      4. git commit -m <Message>.
      5. If -Push: git push.

    For an interactive variant, see commit-push-interactive.ps1.

.PARAMETER Message
    Commit message (required). Also used as the primary bullet of the new
    RELEASE_NOTES.md section when a version bump is requested.

.PARAMETER VersionBump
    'none' | 'patch' | 'minor' | 'major'. Required. Use 'none' for a plain
    commit (and optional push) without bumping the version.

.PARAMETER Push
    Push to origin after a successful commit.

.PARAMETER DryRun
    Print every action but perform no writes, commits, or pushes.

.PARAMETER FilesChangedOverride
    Optional explicit list of paths for the RELEASE_NOTES.md 'Files Changed'
    section. If omitted, the script computes the list via Get-DefaultFilesChanged.

.PARAMETER Branch
    Optional branch to commit on. If supplied and different from the current
    branch, the script creates it (or checks it out if it already exists),
    carrying the working-tree changes along, before staging/committing. Use
    this to keep release-prep work on a PR branch (e.g. 'release/v4.11.0')
    instead of committing straight to the base branch.

.PARAMETER AllowMainCommit
    Escape hatch: permit a version-bump run to commit directly on the base
    branch (main/master). Without this, a bump run on the base branch and no
    -Branch is refused (release-prep belongs on a PR branch). Plain commits
    (-VersionBump none) are never blocked — those may go straight to main.

.EXAMPLE
    # Plain commit, no bump
    .\contribute\commit-push.ps1 -Message "Fix: typo in peak shave" -VersionBump none

.EXAMPLE
    # Minor bump + push, on a fresh PR branch
    .\contribute\commit-push.ps1 -Message "Feat: Zero import strategy" `
        -VersionBump minor -Branch release/v4.11.0 -Push

.EXAMPLE
    # Preview without writing anything
    .\contribute\commit-push.ps1 -Message "Feat: x" -VersionBump patch -DryRun
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$Message,

    [Parameter(Mandatory)]
    [ValidateSet('none', 'patch', 'minor', 'major')]
    [string]$VersionBump,

    [string[]]$FilesChangedOverride,

    [string]$Branch,

    [switch]$AllowMainCommit,

    [switch]$Push,

    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ─────────────────────────────────────────────────────────────────────────────
# Silence Git's benign "LF will be replaced by CRLF" (core.safecrlf=warn) notice
# for this process and every child script / Git call it spawns.
#
# On a Windows clone with core.autocrlf=true, Git writes that warning to stderr
# for each LF-normalised file it touches (git diff/add/commit). Because this
# script runs with $ErrorActionPreference='Stop', PowerShell promotes that
# stderr line to a terminating NativeCommandError and aborts the release
# mid-run. Injecting core.safecrlf=false via Git's env-config keeps autocrlf
# normalisation intact (commits stay LF) and suppresses only the cosmetic
# warning — no local `git config` change required on the contributor's machine.
$safecrlfIdx = if ($env:GIT_CONFIG_COUNT) { [int]$env:GIT_CONFIG_COUNT } else { 0 }
Set-Item "env:GIT_CONFIG_KEY_$safecrlfIdx"   'core.safecrlf'
Set-Item "env:GIT_CONFIG_VALUE_$safecrlfIdx" 'false'
$env:GIT_CONFIG_COUNT = [string]($safecrlfIdx + 1)

$ROOT = Resolve-Path (Join-Path $PSScriptRoot '..')

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────
function Write-Step { param([string]$m) Write-Host "  [STEP] $m" -ForegroundColor Cyan }
function Write-Action { param([string]$m) Write-Host "  [DO  ] $m" -ForegroundColor Green }
function Write-DryAction { param([string]$m) Write-Host "  [DRY ] $m" -ForegroundColor Yellow }
function Write-Fail { param([string]$m) Write-Host "  [FAIL] $m" -ForegroundColor Red }

function Invoke-OrDryRun {
    param([string]$Label, [scriptblock]$Block)
    if ($DryRun) {
        Write-DryAction $Label
    }
    else {
        Write-Action $Label
        & $Block
    }
}

# Returns $true if the only diff for $Path (vs HEAD) is version-label content.
function Test-VersionLabelOnlyChange {
    param([string]$Path)
    $diff = git diff HEAD -- $Path 2>$null
    if (-not $diff) { return $false }  # untracked or no diff
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

# Parses 'git status --porcelain' into objects { Status, Path }.
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

# Computes the default Files Changed list per the conventions documented in
# .github/copilot-instructions.md (now copilot/Claude instructions):
#   - Always include 'home assistant/dashboard.yaml'
#   - Include node-red/* only if functional changes (not version-label-only)
#   - Exclude docs/, README.md, RELEASE_NOTES.md, .claude/, .github/
function Get-DefaultFilesChanged {
    $files = @()
    foreach ($entry in (Get-PorcelainStatus)) {
        $path = $entry.Path
        $status = $entry.Status
        $norm = $path -replace '\\', '/'

        # Deletions are not "files changed" for release-notes purposes
        if ($status -match 'D') { continue }

        # Exclusions
        if ($norm -match '^\.claude/') { continue }
        if ($norm -match '^\.github/') { continue }
        if ($norm -match '^docs/') { continue }
        if ($norm -eq 'README.md') { continue }
        if ($norm -eq 'RELEASE_NOTES.md') { continue }
        if ($norm -match '^notes/') { continue }

        # Always-include
        if ($norm -eq 'home assistant/dashboard.yaml') {
            $files += $path
            continue
        }

        # node-red filter: skip if version-label only
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

    # Build new section.
    # Format matches the convention used by earlier releases:
    #   - **<Type>: <Headline>**
    #     * <detail bullet>
    # The script emits a single bold headline derived from the commit message;
    # the user is expected to expand it with sub-bullets before publishing
    # (check.ps1 issues a warning if the section is missing, but does not
    # validate its content).
    $section = @()
    $section += "## $Version"
    $section += "- **$BulletMessage**"
    $section += ""
    $section += "- **Files Changed:**"
    foreach ($f in $Files) { $section += "  - ``$f``" }
    $section += ""
    $sectionText = ($section -join "`n") + "`n"

    # Insert before the first '## x.y.z' heading (limit to a single replacement)
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
        Write-Fail "$ScriptName exited with code $LASTEXITCODE - halt"
        exit 1
    }
}

# ─────────────────────────────────────────────────────────────────────────────
# Banner
# ─────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "=====================================================" -ForegroundColor White
Write-Host "  commit-push$(if ($DryRun) { ' (DRY RUN)' })" -ForegroundColor White
Write-Host "=====================================================" -ForegroundColor White
Write-Host ""

# ─────────────────────────────────────────────────────────────────────────────
# Pre-flight: nothing to commit?
# ─────────────────────────────────────────────────────────────────────────────
if (-not (Get-PorcelainStatus)) {
    Write-Fail "No changes to commit."
    exit 1
}

# ─────────────────────────────────────────────────────────────────────────────
# Pre-flight: branch selection + base-branch guard
#
#   - A version-bump run is a release-prep and belongs on a PR branch.
#   - Plain commits (-VersionBump none) are the everyday path and may go
#     straight to the base branch (main/master) — they are never blocked.
# ─────────────────────────────────────────────────────────────────────────────
$baseBranches = @('main', 'master')
$currentBranch = (git rev-parse --abbrev-ref HEAD).Trim()

if ($Branch -and $Branch -ne $currentBranch) {
    $exists = @(git branch --list $Branch).Count -gt 0
    $checkoutLabel = if ($exists) { "git checkout $Branch" } else { "git checkout -b $Branch" }
    Write-Step "Switching to branch '$Branch'"
    Invoke-OrDryRun $checkoutLabel {
        if ($exists) { git checkout $Branch } else { git checkout -b $Branch }
        if ($LASTEXITCODE -ne 0) { throw "branch checkout failed" }
    }
    # Reflect the intended branch for the guard below (in DryRun no switch happened).
    $currentBranch = $Branch
}

if (($VersionBump -ne 'none') -and ($baseBranches -contains $currentBranch) -and (-not $AllowMainCommit)) {
    Write-Fail "Refusing to run a version-bump release-prep directly on '$currentBranch'."
    Write-Host "  A release-prep belongs on a PR branch. Either:" -ForegroundColor Yellow
    Write-Host "    - re-run via /release-prep (it creates 'release/v<new-version>' for you), or" -ForegroundColor Yellow
    Write-Host "    - pass -Branch release/v<new-version> to this script, or" -ForegroundColor Yellow
    Write-Host "    - pass -AllowMainCommit to intentionally commit on '$currentBranch'." -ForegroundColor Yellow
    exit 1
}

# ─────────────────────────────────────────────────────────────────────────────
# 1. Initial check
# ─────────────────────────────────────────────────────────────────────────────
Write-Step "Running check.ps1"
Invoke-ChildScript 'check.ps1'

# ─────────────────────────────────────────────────────────────────────────────
# 2. Version bump (optional)
# ─────────────────────────────────────────────────────────────────────────────
$newVersion = $null
if ($VersionBump -ne 'none') {
    Write-Step "Bumping version: $VersionBump"
    $bumpArgs = @{ Type = $VersionBump }
    if ($DryRun) { $bumpArgs.DryRun = $true }
    Invoke-ChildScript 'bump-version.ps1' $bumpArgs

    if (-not $DryRun) {
        Write-Step "Re-running check.ps1 after bump"
        Invoke-ChildScript 'check.ps1'
    }

    # Read new version from authoritative source
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

    # ── 3. Compute Files Changed and update release notes ─────────────────
    if ($FilesChangedOverride) {
        $filesChanged = @($FilesChangedOverride)
    }
    else {
        $filesChanged = @(Get-DefaultFilesChanged)
    }

    Write-Step "Files Changed for release notes:"
    foreach ($f in $filesChanged) { Write-Host "    - $f" -ForegroundColor White }

    Update-ReleaseNotes -Version $newVersion -BulletMessage $Message -Files $filesChanged
}

# ─────────────────────────────────────────────────────────────────────────────
# 4. Stage
# ─────────────────────────────────────────────────────────────────────────────
Write-Step "Staging changes"
Invoke-OrDryRun "git add -A" {
    git add -A
    if ($LASTEXITCODE -ne 0) { throw "git add failed" }
}

Write-Step "git status after staging:"
git status --short

# ─────────────────────────────────────────────────────────────────────────────
# 5. Commit
# ─────────────────────────────────────────────────────────────────────────────
Write-Step "Committing"
Invoke-OrDryRun "git commit -m `"$Message`"" {
    git commit -m $Message
    if ($LASTEXITCODE -ne 0) { throw "git commit failed" }
}

# ─────────────────────────────────────────────────────────────────────────────
# 6. Push (optional)
# ─────────────────────────────────────────────────────────────────────────────
if ($Push) {
    Write-Step "Pushing to origin"
    # Use 'git push -u origin HEAD' so the first push on a new branch sets
    # upstream tracking. On subsequent pushes it is a no-op for tracking.
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
