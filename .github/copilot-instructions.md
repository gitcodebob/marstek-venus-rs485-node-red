# GitHub Copilot Instructions for this Repository

## General Guidelines:
- Prioritize security, performance, and readability in code suggestions.
- Use clear and concise language.

## Commit Workflow:
- When asked to commit, always:
    1. Stage all relevant modified and new files in git.
    1. Perform `git status` to check the current state of the repository.
    1. Generate a concise, descriptive commit message in the imperative mood (e.g., "Fix: Resolve login issue," "Feat: Add user profiles").
    1. Discuss the proposed commit message with the user for approval, but do not commit yet. First:
    1. If documentation related to the changes exists (e.g., in `README.md`), suggest updates or ask if updates are needed.
    1. Use the approved commit message to update the `RELEASE_NOTES.md` if applicable.
        1. Ask the user if they want a major, minor, or patch version bump according to Semantic Versioning (SemVer).
        1. Ask the user if the release notes should contain the specific files changed, or if a general summary is sufficient.
        1. Also update the `Configuration and settings (v <version>)` in `home assistant\dashboard.yaml` to match the changes and current SemVer.
    1. If the user approves, commit the changes with the generated message.
    1. After a successful commit, offer to push the changes to the remote repository.
    1. Ensure all actions are logged and transparent.

## Documentation:
- If code changes involve new features or significant modifications, suggest updating relevant documentation files (e.g., `README.md`, `docs/api.md`).
- Offer to generate basic documentation stubs or suggest areas for improvement.