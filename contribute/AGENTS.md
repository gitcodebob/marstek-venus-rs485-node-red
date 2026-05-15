# Contribute Scripts — AI Agent Reference

This folder contains PowerShell automation scripts for maintaining this project.
Use these scripts as part of the commit and release workflow defined in
[`.github/copilot-instructions.md`](../.github/copilot-instructions.md).

> **Cross-platform:** Scripts require [PowerShell Core (`pwsh`)](https://github.com/PowerShell/PowerShell) v7+,
> which is available on Windows, macOS, and Linux. Windows users may also use Windows PowerShell 5.1.

---

## Scripts

### `check.ps1` — Project validation

Validates the project for consistency. Run this before any commit or release.

**Usage:**
```powershell
# Windows
.\contribute\check.ps1

# macOS / Linux
./contribute/check.ps1
```

**What it checks:**
| # | Check | Failure behaviour |
|---|-------|-------------------|
| 1 | Every `node-red/*.json` is valid JSON | FAIL (exit 1) |
| 2 | Every flow file has ≥ 5 nodes | FAIL (exit 1) |
| 3 | All versioned flow labels and `dashboard.yaml` match the version in `01 start-flow.json` | FAIL (exit 1) |
| 4 | Every individual flow tab label exists in `all-flows-in-one-file.json` | FAIL (exit 1) |
| 5 | `RELEASE_NOTES.md` has a `## <version>` section for the current version | WARN only |

**Exit codes:** `0` = all checks passed, `1` = one or more failures.

**When to use (AI agent):**
- After bumping the version with `bump-version.ps1`
- Before staging files for a commit
- To verify a user-reported inconsistency

---

### `bump-version.ps1` — SemVer bump

Increments the version across all relevant files.

**Usage:**
```powershell
# Windows
.\contribute\bump-version.ps1 -Type patch
.\contribute\bump-version.ps1 -Type minor
.\contribute\bump-version.ps1 -Type major
.\contribute\bump-version.ps1 -Type patch -DryRun  # preview only, no writes

# macOS / Linux
./contribute/bump-version.ps1 -Type patch
./contribute/bump-version.ps1 -Type patch -DryRun
```

**Files updated:**
| File | What changes |
|------|-------------|
| `node-red/01 start-flow.json` | `label` of first object |
| `node-red/02 strategy-*.json` | `label` of first object (all 7 files) |
| `node-red/all-flows-in-one-file.json` | All version labels (after verifying current version matches) |
| `home assistant/dashboard.yaml` | Version string in the markdown content card |

**Files NOT updated by this script (require manual action):**
| File | Why |
|------|-----|
| `RELEASE_NOTES.md` | Requires human-authored release description |
| `node-red/00 master-switch-flow.json` | No version label |
| `node-red/00 presets-switch-flow.json` | No version label |

**When to use (AI agent):**
- When the user asks for a patch / minor / major version bump
- Always run `check.ps1` immediately after to confirm consistency
- Per the copilot-instructions commit workflow, ask the user which bump type before running

---

### `release.ps1` — Post-merge tag + GitHub release

Owner-only. Runs the deterministic part of the release flow *after* the
release-prep PR has been squash-merged on GitHub. Driven by the `/release`
slash command, which handles PR creation and waits for the human merge.

**Usage:**
```powershell
.\contribute\release.ps1 -Theme "Zero import & peak shave"
.\contribute\release.ps1 -Theme "x" -FeatureBranch fix/peak-shave
.\contribute\release.ps1 -Theme "x" -DryRun
```

**What it does:**
1. Switches to `main` (or `-BaseBranch`) and `git pull --ff-only`.
2. Reads the current version from `node-red/01 start-flow.json`.
3. Validates `## <version>` exists in `RELEASE_NOTES.md`.
4. Refuses to proceed if `v<version>` already exists locally or on origin.
5. Creates and pushes the tag `v<version>`.
6. Extracts the RELEASE_NOTES section and injects the Buy Me A Battery
   support block immediately before `- **Files Changed:**` (idempotent —
   skipped if the block is already present).
7. Runs `gh release create v<version> --title "v<version> - <Theme>" --latest`.
8. (Optional) Deletes the local + remote feature branch if `-FeatureBranch`
   is given. Uses `git branch -d` (safe — refuses unmerged branches).

**When to use (AI agent):**
- Only via the `/release` slash command, after the user confirms the PR was
  squash-merged. Do not invoke directly.

---

## Recommended agent workflow for a release

```
1.  /release-prep        (bump, release-notes stub, commit, push)
2.  User expands the RELEASE_NOTES.md stub into proper sub-bullets
3.  /release             (PR -> user squash-merges -> tag -> GH release)
```
