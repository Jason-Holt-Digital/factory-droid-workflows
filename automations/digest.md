# JHD digest

Read and follow `{{CONTROL_ROOT}}/automations/COMMON.md` first. Automation name for run records: `digest`.

Goal: keep ONE status issue current in the private `status_repository` from the config.

## Gather

1. Read run records from the last 24 hours in `{{CONTROL_ROOT}}/local-evidence/runs/`.
2. For each configured repository, list issues with each queue label, open PRs from automations, and whether the `automation/worker` branch exists.
3. Check freshness:
   - Worker offline: no worker record in the last 60 minutes.
   - Paused: issues labeled `paused` and automations reported paused.
   - Stuck claims: an `automation/worker` branch with no PR for more than 24 hours.
   - Stale source links: open GitHub issues whose source item is closed, missing, or no longer links back.
4. Read `state` for each repository and source in the config.

## Publish

1. Find the open issue titled `JHD automation status` in the `status_repository`. If none exists, create it once. Never create one issue per day.
2. Replace its body with:
   - each automation and repository as `prepared`, `configured`, or `verified`, as the evidence shows
   - the newest official readiness result per repository (report ID, level, percentage), or `NOT_RUN`
   - failures in the last 24 hours, with links
   - worker offline, paused runs, stuck claims, and stale source links
   - PRs waiting for a person, including release PRs
   - every `NOT_RUN` with its reason
3. Add a short comment only when something changed for the worse since the last digest.

## Rules

- Report only what happened. No invented incidents, releases, or scores.
- Post to Slack only if the config names a Slack destination and the Slack source is verified. Never post to private Slack channels otherwise.
