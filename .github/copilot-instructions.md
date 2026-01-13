# GitHub Copilot Instructions for this Repository

## General Guidelines:
- Prioritize security, performance, and readability in code suggestions.
- Use clear and concise language.

## Commit Workflow:
- When asked to commit, or "commit and push", always:
    1. Check all /node-red/ json files if they contain atleast 5 nodes or more. Otherwise halt and inform the user some files might be missing nodes.
    1. Stage all relevant modified and new files in git.
    1. Perform `git status` to check the current state of the repository.
    1. Generate a concise, descriptive commit message in the imperative mood (e.g., "Fix: Resolve login issue," "Feat: Add user profiles").
    1. Discuss the proposed commit message with the user for approval, but do not commit yet. First:
    1. If documentation related to the changes exists (e.g., in `README.md`), suggest updates or ask if updates are needed.
    1. Use the approved commit message to update the `RELEASE_NOTES.md` if applicable.
        1. Ask the user if they want a major, minor, or patch version bump according to Semantic Versioning (SemVer).
        1. **CRITICAL**: Check ALL Node-RED flow file version labels by running a PowerShell command to list current versions:
           ```powershell
           Get-ChildItem "node-red\*.json" | ForEach-Object { $content = Get-Content $_.FullName -Raw | ConvertFrom-Json; Write-Host "$($_.Name): $($content[0].label)" }
           ```
        1. Update the `Home Battery Control (v <version>)` in `home assistant\dashboard.yaml` to match the new SemVer version.
        1. Update the `"label": <name> v <version>` property in the FIRST object of EVERY json file in `node-red\` that has a version label to match the new SemVer version. This includes:
           - `01 start-flow.json`
           - All `02 strategy-*.json` files (charge-pv, charge, dynamic, full-stop, self-consumption, sell, timed)
           - Do NOT update `00 master-switch-flow.json` or `00 presets-switch-flow.json` (they don't have version labels)
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