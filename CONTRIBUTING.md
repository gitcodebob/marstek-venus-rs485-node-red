# Contributing

Thanks for your interest in contributing to this project!

## Before you submit a pull request

Run the validation script from the repository root to catch any inconsistencies before committing:

```powershell
# Windows (PowerShell 5.1 or pwsh)
.\contribute\check.ps1

# macOS / Linux (pwsh)
./contribute/check.ps1
```

The script checks JSON validity, node counts, version consistency across all flow files, and more. Fix any reported failures before opening a PR.

## The `contribute/` folder

The [`contribute/`](contribute/) folder contains automation scripts for project maintenance. See [`contribute/AGENTS.md`](contribute/AGENTS.md) for the full reference.

- **`check.ps1`** — for contributors: validates project consistency. Run this before every commit.
- **`bump-version.ps1`** — for maintainers only: bumps the SemVer version across all relevant files on release.

## General guidelines

Please also review [`.github/copilot-instructions.md`](.github/copilot-instructions.md) for the project's coding standards and commit workflow expectations.
