---
description: Create PR, wait for squash-merge, then tag and publish a GitHub release
allowed-tools: Bash, PowerShell, Read, Grep, AskUserQuestion
---

The user has already run `/release-prep` (commit + version bump + push on a
feature branch). This command finishes the release: open the PR, wait for
the human to squash-merge, then tag and publish the GitHub release.

This is owner-only — assume `gh` is authenticated as the repo owner.

The deterministic work (switch to main, pull, tag, push tag, build body,
`gh release create --latest`, optional branch cleanup) lives in
`contribute/release.ps1`. Your job is to orchestrate around it.

## Phase 1 — Open the PR

1. **Pre-flight checks** (halt on any failure, do not bypass):
   - `git rev-parse --abbrev-ref HEAD` must NOT return `main`.
   - `git status --short --branch` must show the branch is pushed (look for
     `[ahead N]` is fine, but `[gone]` or no upstream means it's not pushed —
     run `/release-prep` first).
   - Working tree must be clean (`git status --porcelain` is empty).
   - Read the current version from `node-red/01 start-flow.json` (the first
     object's `label`, regex `v(\d+\.\d+\.\d+)`).
   - Confirm `RELEASE_NOTES.md` has a `## <version>` section.

2. **Compute PR title** from the latest commit subject:
   `git log -1 --pretty=%s`. This is typically the release-prep commit and
   makes a clean PR title.

3. **Create the PR** (or reuse if one already exists for this branch):
   ```powershell
   gh pr create --base main --title "<title>" `
       --body "Release **v<version>** — see [RELEASE_NOTES.md](./RELEASE_NOTES.md) for the changelog."
   ```
   If `gh pr create` fails with "a pull request for branch X already exists",
   fetch the existing URL with `gh pr view --json url -q .url` and continue.

   Capture the PR number with `gh pr view --json number -q .number` — you'll
   need it in Phase 2 to verify the merge state (the PR view defaults to the
   current branch, which won't work once we've switched to main).

4. **Print the PR URL** and tell the user, clearly:
   > Review the PR on GitHub, then **squash-merge** it. Come back here when done.

## Phase 2 — Wait for squash-merge

5. Use **AskUserQuestion** to wait:
   - Header: `Merged?`
   - Options: `Yes, merged` / `Not yet — wait`
   - If they pick "Not yet", ask again later. Don't proceed on a guess.

6. After they confirm merged, **verify**:
   ```powershell
   gh pr view <pr-number> --json state -q .state
   ```
   Must return `MERGED`. If it returns `OPEN` or `CLOSED`, halt and report —
   the user may have closed without merging, or the merge hasn't propagated.

## Phase 3 — Theme + cleanup choice

7. Use **AskUserQuestion** to gather:
   - **Theme** (~3 words for the release title). Propose 1–2 candidates
     derived from the bold headlines in the RELEASE_NOTES.md section
     (e.g. `Zero import & peak shave`, `Charge after-goal & dynamic v2`).
   - **Delete feature branch?** Default Yes (local + origin). Choose No only
     if the user wants to keep the branch around (rare).

## Phase 4 — Tag and publish

8. **Invoke the script**:
   ```powershell
   .\contribute\release.ps1 -Theme "<theme>" `
       [-FeatureBranch "<branch>"]  # only if user chose to delete
   ```
   For a preview pass without writing anything, add `-DryRun`.

9. If the script exits non-zero, **report the error verbatim and stop**. Do
   not retry blindly, do not bypass with `--force`. Common causes:
   - Tag already exists → release was already published; investigate
     before doing anything destructive.
   - `git pull --ff-only` failed → diverged main; the user needs to
     reconcile manually.
   - `gh release create` failed → check `gh auth status` and the network.

10. On success, print the release URL the script emitted.

## Notes

- The release body comes from the existing `## <version>` section in
  `RELEASE_NOTES.md`. The script automatically injects the Buy Me A Battery
  support block immediately before the `- **Files Changed:**` line — do not
  add it manually to `RELEASE_NOTES.md`.
- Title format is `v<X.Y.Z> - <Theme>` (the script enforces this).
- The release is marked `--latest`. The script refuses to publish if the
  `v<version>` tag already exists on either local or origin.
- `contributor` and `origin` are different remotes — the script always
  pushes to `origin` (the user's fork/repo), which is correct.
