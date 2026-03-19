# GitHub Copilot Instructions for this Repository

## General Guidelines:
- Prioritize security, performance, and readability in code suggestions.
- Use clear and concise language.
- This project contains a Node-RED integration for Home Assistant, with a focus on maintaining a user-friendly dashboard and ensuring seamless updates across all flow files.

## Contribute Scripts:
The `contribute/` folder contains automation scripts. See `contribute/AGENTS.md` for the full reference.
- **`.\contribute\check.ps1`** — Validates JSON, node counts, version consistency, combined file sync, and release notes. Run before every commit.
- **`.\contribute\bump-version.ps1 -Type <patch|minor|major>`** — Bumps the SemVer in all flow labels, `all-flows-in-one-file.json`, and `dashboard.yaml`. Use `-DryRun` to preview.

## Commit Workflow:
- When asked to "commit", "commit only" or "commit wip", always:
    1. Save all files.
    1. Stage all relevant modified and new files in git.
    1. Perform `git status` to check the current state of the repository.
    1. Generate a concise, descriptive commit message in the imperative mood (e.g., "Fix: Resolve login issue," "Feat: Add user profiles").
    1. Try to generate a commit command that can be auto-approved.
    1. Commit the changes with the generated message, but do not push yet.
- When asked to "commit and push", always:
    1. Run `.\contribute\check.ps1`. If it fails, halt and report the errors to the user before proceeding.
    1. Stage all relevant modified and new files in git.
    1. Perform `git status` to check the current state of the repository.
    1. Generate a concise, descriptive commit message in the imperative mood (e.g., "Fix: Resolve login issue," "Feat: Add user profiles").
    1. Discuss the proposed commit message with the user for approval, but do not commit yet. First:
    1. If documentation related to the changes exists (e.g., in `README.md`), suggest updates or ask if updates are needed.
    1. Use the approved commit message to update the `RELEASE_NOTES.md` if applicable.
        1. Ask the user if they want a major, minor, or patch version bump according to Semantic Versioning (SemVer).
        1. **CRITICAL**: Run `.\contribute\bump-version.ps1 -Type <type>` to apply the version bump, then run `.\contribute\check.ps1` to verify all files are consistent.
        1. Update the release notes "**Files Changed:**" section:
           - **ALWAYS include** `home assistant\dashboard.yaml` (user-facing version indicator)
           - **ONLY include** `node-red\` files that have functional/code changes beyond just version label updates
           - **EXCLUDE** any `node-red\` flow files where the only change was updating the version label
           - Omit documentation files (e.g., `README.md`, `RELEASE_NOTES.md`, `docs\`)
    1. If the user approves, commit the changes with the generated message.
    1. After a successful commit, offer to push the changes to the remote repository.
    1. Ensure all actions are logged and transparent.

## Documentation:
- If code changes involve new features or significant modifications, suggest updating relevant documentation files (e.g., `README.md`, `docs/api.md`).
- Offer to generate basic documentation stubs or suggest areas for improvement.