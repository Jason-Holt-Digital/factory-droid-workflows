# JHD weekly Digest

Read and follow `{{CONTROL_ROOT}}/automations/COMMON.md` first. Automation name for run records: `digest`.

Goal: once a week, keep ONE status issue current in the private `status_repository` from the config. Summarize the last seven days and name decisions waiting for a person.

## Gather

1. Read run records from the last seven days in `{{CONTROL_ROOT}}/local-evidence/runs/`.
2. For each configured repository, list open automation PRs, relevant queue labels, and actual review, wiki, triage, and CI Steward results from the last seven days.
3. Read local automation status and `automation_policy` in the config. Report Ticket-to-PR and recurring Intake as deferred, not offline or failed.
4. Check schedule freshness only for active scheduled automations. Compare their last run with their actual cron cadence and activation time. A monthly report is not overdue after a week. Paused automations and event-driven workflows with no matching events are not incidents.
5. Report any existing `automation/worker` branch as a legacy claim for a person to inspect. Do not delete it or resume work.
6. Read each repository's and source's verification state. Inspect source links only through verified mappings and connectors. Do not poll unverified sources or write back to them.

## Publish

1. Find the open issue titled `JHD automation status` in the `status_repository`. If none exists, create it once. Never create one issue per run.
2. Update the automation-status section with:
   - each automation and repository as prepared, configured, verified, or deferred, supported by evidence
   - the newest official readiness result per repository, with its date, report ID, level, and percentage, or `NOT_RUN`
   - changes and failures in the last seven days, with links
   - paused runs, genuinely missed scheduled runs, legacy claims, and source-verification gaps
   - PRs and release decisions waiting for a person
   - every `NOT_RUN` and its reason
3. Preserve human-written decisions and unrelated status-issue sections. Add a short comment only when something worsened since the last digest.

## Rules

- Report only what happened. A skipped job or successful generation without a wiki PR is not execution proof.
- Do not implement tickets, assign work, alter source fields, or merge PRs.
- Post to Slack only if the config names a destination and that connection is verified.
