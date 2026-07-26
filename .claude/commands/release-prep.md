---
description: Prepare a release — version bump, release notes, commit, push
allowed-tools: Bash, PowerShell, Read, Grep, AskUserQuestion
---

The user wants to prepare a release for this repo. The mechanics are scripted
in `contribute/commit-push.ps1`; your job is to gather the two decisions it
needs (commit message + bump type) and invoke it.

## Steps

1. Read the current state:
   - `git status` (working tree)
   - `git diff --stat HEAD` (scope of changes)
   - `git log --oneline -5` (recent commit style and version pace)

2. Propose a **commit message** in imperative mood, matching the style of
   recent commits in this repo (e.g., `Feat: ...`, `Fix: ...`, `Tweak: ...`).
   Show it to the user and let them adjust before approval.

3. Ask the user for the **bump type** via AskUserQuestion:
   - `patch` — bug fixes, small tweaks
   - `minor` — new features, backward-compatible
   - `major` — breaking changes

4. **Pick the PR branch** (a version-bump release-prep must not land straight
   on the base branch — `/release` needs a branch to open a PR from):
   - Check the current branch: `git rev-parse --abbrev-ref HEAD`.
   - If it is `main` (or `master`): compute the new version from the current
     version + the chosen bump type, and use `-Branch release/v<new-version>`
     (e.g. `release/v4.11.0`). The script creates it and carries the working
     changes over before committing.
   - If already on a non-base branch: no `-Branch` needed — commit there.

   `commit-push.ps1` enforces this: a bump run on `main`/`master` without
   `-Branch` is refused (with an `-AllowMainCommit` escape hatch for the rare
   intentional direct-to-main release). Don't reach for `-AllowMainCommit`
   unless the user explicitly wants no PR.

5. If the changes are large or unusual, suggest a **dry-run first**:
   `.\contribute\commit-push.ps1 -Message "<msg>" -VersionBump <type> [-Branch release/v<new>] -DryRun`

   Inspect the dry-run output (especially the computed "Files Changed" list)
   before continuing.

6. After approval, invoke the real run with `-Push`:
   `.\contribute\commit-push.ps1 -Message "<msg>" -VersionBump <type> [-Branch release/v<new>] -Push`

7. If `check.ps1` or `bump-version.ps1` fails, **report the error verbatim
   and stop** — do not bypass with `--no-verify`, `-Force`, or similar.
   Investigate the root cause and fix it before retrying.

## Notes

- The script computes the **Files Changed** list automatically per the rules
  in `contribute/AGENTS.md`. Only override via `-FilesChangedOverride @(...)`
  if the user explicitly asks for a different list.
- You may suggest README or docs updates if the changes warrant it, but
  **don't push for them** — users generally prefer minimal doc churn.
- The release notes section the script writes is a stub (`- **<message>**`
  + Files Changed list). The convention in `RELEASE_NOTES.md` is one bold
  headline per change with indented `*` sub-bullets. After the script writes
  the stub, offer to help expand the headline into proper sub-bullets before
  the user publishes.
- `.claude/` paths are staged like any other change (per `.gitignore` rules —
  `settings.local.json` and `sessions/` are kept local). No special handling
  needed to ship a slash command or skill alongside a release.
- For a plain commit without bumping the version, use `-VersionBump none`.
  That path is supported but is **not** the primary purpose of this command —
  for everyday commits, just give Claude a natural-language request instead.
  Plain (`none`) commits are **not** branch-guarded — they may go straight to
  `main`, matching how trivial `chore`/`docs` commits already land in history.
  Only version-bump runs are steered onto a `release/v<new-version>` branch.
