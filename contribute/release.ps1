<#
.SYNOPSIS
    Post-merge release publication: switch to main, tag, push, create GH release.

.DESCRIPTION
    Runs the deterministic part of the release flow that happens AFTER the
    release-prep PR has been squash-merged on GitHub. Designed for AI
    orchestration: the slash command (`/release`) creates the PR, waits for
    the human to merge it, gathers the theme, then invokes this script.

    Workflow:
      1. Switch to BaseBranch (default 'main') and `git pull --ff-only`.
      2. Read the current version from `node-red/01 start-flow.json`.
      3. Verify RELEASE_NOTES.md has a `## <version>` section.
      4. Verify the tag `v<version>` does not yet exist locally or remotely.
      5. Create and push the tag.
      6. Build the release body:
           a. Extract the RELEASE_NOTES.md section for this version.
           b. Inject the Buy Me A Battery support block immediately before
              the `- **Files Changed:**` line (skip if already present).
      7. Create the GitHub release as 'latest' via `gh release create`,
         title `v<version> - <Theme>`.
      8. (Optional) Delete the feature branch locally and on origin.

    Prerequisites the slash command is expected to have verified:
      - The PR for the feature branch has been merged on GitHub.
      - `gh` is authenticated as the repo owner.
      - No uncommitted changes exist that would block `git switch main`.

.PARAMETER Theme
    Short (~3 words) theme appended to the release title after the version.
    Example: 'Zero import & peak shave'. Required.

.PARAMETER FeatureBranch
    Optional. If provided, the script deletes this branch locally and on
    origin after the release is published. Omit to keep the branch around.

.PARAMETER BaseBranch
    Branch to switch to and tag from. Default: 'main'.

.PARAMETER Tag
    Optional explicit tag (e.g. 'v4.10.1'). If omitted, the script computes
    `v<version>` from `01 start-flow.json`.

.PARAMETER DryRun
    Print every action but perform no writes, tag creation, pushes, or
    release creation. The release-body builder still runs and is printed.

.EXAMPLE
    .\contribute\release.ps1 -Theme "Zero import & peak shave"

.EXAMPLE
    .\contribute\release.ps1 -Theme "Hotfix peak shaving" -FeatureBranch fix/peak-shave

.EXAMPLE
    .\contribute\release.ps1 -Theme "x" -DryRun
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$Theme,

    [string]$FeatureBranch,

    [string]$BaseBranch = 'main',

    [string]$Tag,

    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ROOT = Resolve-Path (Join-Path $PSScriptRoot '..')

# Buy Me A Battery support block - injected before "Files Changed".
# Trailing space after "?**" on the first line is intentional (preserves the
# exact markdown the user dictated). Built line-by-line rather than via a
# here-string so the trailing whitespace survives editor save-trimming.
$BMAC_BLOCK = ("- **Want to support this project?** " + "`n" +
    '  - [![Buy Me A Battery](https://img.shields.io/badge/Buy%20Me%20A%20Battery-Support-FFDD00?logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/home.battery.control)')

# ----------------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------------
function Write-Step { param([string]$m) Write-Host "  [STEP] $m" -ForegroundColor Cyan }
function Write-Action { param([string]$m) Write-Host "  [DO  ] $m" -ForegroundColor Green }
function Write-DryAction { param([string]$m) Write-Host "  [DRY ] $m" -ForegroundColor Yellow }
function Write-Fail { param([string]$m) Write-Host "  [FAIL] $m" -ForegroundColor Red }

function Invoke-OrDryRun {
    param([string]$Label, [scriptblock]$Block)
    if ($DryRun) { Write-DryAction $Label } else { Write-Action $Label; & $Block }
}

function Get-CurrentVersion {
    $startFile = Join-Path $ROOT 'node-red/01 start-flow.json'
    if (-not (Test-Path $startFile)) {
        Write-Fail "Cannot find $startFile"
        exit 1
    }
    $startJson = Get-Content $startFile -Raw -Encoding UTF8 | ConvertFrom-Json
    $startLabel = @($startJson)[0].label
    if ($startLabel -match 'v(\d+\.\d+\.\d+)') { return $matches[1] }
    Write-Fail "Could not read version from 01 start-flow.json (label was '$startLabel')"
    exit 1
}

function Get-ReleaseNotesSection {
    param([string]$Version)
    $rnPath = Join-Path $ROOT 'RELEASE_NOTES.md'
    $rnRaw = Get-Content $rnPath -Raw -Encoding UTF8
    $verEsc = [regex]::Escape($Version)
    $pattern = "(?ms)^## $verEsc\b.*?(?=^## \d+\.\d+\.\d+\b|\z)"
    $m = [regex]::Match($rnRaw, $pattern)
    if (-not $m.Success) {
        Write-Fail "RELEASE_NOTES.md has no '## $Version' section."
        exit 1
    }
    return $m.Value.TrimEnd()
}

function Add-BmacBlock {
    param([string]$Section)
    if ($Section -match 'Want to support this project') {
        Write-Host "  Section already contains the support block - leaving as is" -ForegroundColor Yellow
        return $Section
    }
    $marker = '- **Files Changed:**'
    if ($Section -notmatch [regex]::Escape($marker)) {
        Write-Host "  Section has no '- **Files Changed:**' marker - appending support block at end" -ForegroundColor Yellow
        return ($Section.TrimEnd() + "`n`n" + $BMAC_BLOCK + "`n")
    }
    $replacement = $BMAC_BLOCK + "`n`n" + $marker
    return $Section.Replace($marker, $replacement)
}

function Test-TagExists {
    param([string]$TagName)
    # Local
    $local = git tag --list $TagName 2>$null
    if ($local) { return $true }
    # Remote
    $remote = git ls-remote --tags origin "refs/tags/$TagName" 2>$null
    if ($remote) { return $true }
    return $false
}

# ----------------------------------------------------------------------------
# Banner
# ----------------------------------------------------------------------------
Write-Host ""
Write-Host "=====================================================" -ForegroundColor White
Write-Host "  release$(if ($DryRun) { ' (DRY RUN)' })" -ForegroundColor White
Write-Host "=====================================================" -ForegroundColor White
Write-Host ""

# ----------------------------------------------------------------------------
# 1. Switch to base branch and pull
# ----------------------------------------------------------------------------
Write-Step "Ensuring local '$BaseBranch' is up to date"

$currentBranch = (git rev-parse --abbrev-ref HEAD).Trim()
if ($currentBranch -ne $BaseBranch) {
    Invoke-OrDryRun "git switch $BaseBranch" {
        git switch $BaseBranch
        if ($LASTEXITCODE -ne 0) { throw "git switch $BaseBranch failed" }
    }
}

Invoke-OrDryRun "git pull --ff-only origin $BaseBranch" {
    git pull --ff-only origin $BaseBranch
    if ($LASTEXITCODE -ne 0) { throw "git pull --ff-only failed" }
}

# ----------------------------------------------------------------------------
# 2. Read version + compute tag
# ----------------------------------------------------------------------------
$version = Get-CurrentVersion
if (-not $Tag) { $Tag = "v$version" }
Write-Host "  Version: $version" -ForegroundColor Green
Write-Host "  Tag:     $Tag" -ForegroundColor Green

# ----------------------------------------------------------------------------
# 3. Validate release notes section exists
# ----------------------------------------------------------------------------
Write-Step "Reading RELEASE_NOTES.md section for $version"
$section = Get-ReleaseNotesSection -Version $version
$body = Add-BmacBlock -Section $section

Write-Host ""
Write-Host "  ----- release body preview -----" -ForegroundColor DarkGray
foreach ($line in ($body -split "`r?`n")) { Write-Host "  | $line" -ForegroundColor DarkGray }
Write-Host "  --------------------------------" -ForegroundColor DarkGray
Write-Host ""

# ----------------------------------------------------------------------------
# 4. Tag - ensure absent, then create + push
# ----------------------------------------------------------------------------
Write-Step "Validating tag '$Tag' is unused"
if (Test-TagExists -TagName $Tag) {
    Write-Fail "Tag '$Tag' already exists locally or on origin. Refusing to overwrite."
    exit 1
}

Write-Step "Creating and pushing tag '$Tag'"
Invoke-OrDryRun "git tag -a $Tag -m `"$Tag`"" {
    git tag -a $Tag -m $Tag
    if ($LASTEXITCODE -ne 0) { throw "git tag failed" }
}
Invoke-OrDryRun "git push origin $Tag" {
    git push origin $Tag
    if ($LASTEXITCODE -ne 0) { throw "git push tag failed" }
}

# ----------------------------------------------------------------------------
# 5. Create GitHub release as 'latest'
# ----------------------------------------------------------------------------
$title = "$Tag - $Theme"
Write-Step "Creating GitHub release '$title'"

$tmp = New-TemporaryFile
try {
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($tmp.FullName, $body, $utf8NoBom)

    Invoke-OrDryRun "gh release create $Tag --title `"$title`" --notes-file <tmp> --latest" {
        gh release create $Tag --title $title --notes-file $tmp.FullName --latest
        if ($LASTEXITCODE -ne 0) { throw "gh release create failed" }
    }
}
finally {
    Remove-Item $tmp.FullName -Force -ErrorAction SilentlyContinue
}

if (-not $DryRun) {
    $releaseUrl = (gh release view $Tag --json url -q .url 2>$null)
    if ($releaseUrl) { Write-Host "  Release URL: $releaseUrl" -ForegroundColor Green }
}

# ----------------------------------------------------------------------------
# 6. Optional feature-branch cleanup
# ----------------------------------------------------------------------------
if ($FeatureBranch) {
    if ($FeatureBranch -eq $BaseBranch) {
        Write-Fail "Refusing to delete the base branch '$BaseBranch'."
        exit 1
    }

    Write-Step "Cleaning up feature branch '$FeatureBranch'"

    # Local delete (safe: -d requires the branch be merged into HEAD)
    $localExists = git rev-parse --verify --quiet "refs/heads/$FeatureBranch" 2>$null
    if ($localExists) {
        Invoke-OrDryRun "git branch -d $FeatureBranch" {
            git branch -d $FeatureBranch
            if ($LASTEXITCODE -ne 0) {
                Write-Host "  Local delete refused (branch may not be merged). Skipping." -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "  Local branch '$FeatureBranch' not found - skipping local delete" -ForegroundColor Yellow
    }

    # Remote delete
    $remoteExists = git ls-remote --heads origin $FeatureBranch 2>$null
    if ($remoteExists) {
        Invoke-OrDryRun "git push origin --delete $FeatureBranch" {
            git push origin --delete $FeatureBranch
            if ($LASTEXITCODE -ne 0) {
                Write-Host "  Remote delete failed - possibly already removed by squash-merge auto-delete." -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "  Remote branch 'origin/$FeatureBranch' not found - skipping remote delete" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=====================================================" -ForegroundColor White
Write-Host "  Done.$(if ($DryRun) { ' (dry run - nothing was written)' })" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor White
Write-Host ""
