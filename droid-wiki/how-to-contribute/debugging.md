# Debugging

Start with the exact gate or failed step, not the final workflow color. `docs/OPERATIONS.md` requires observed results and explicit skipped-check reasons; a green skipped job or warning-only publish failure is not verification.

## Hosted workflow runbook

| Symptom | Check first | Source |
| --- | --- | --- |
| Modern review, mentions, triage, or Steward is skipped | Exact repository enable variable and event eligibility. Unset is off. | `.github/workflows/factory-review.yml`, `.github/workflows/factory-mentions.yml`, `.github/workflows/factory-triage.yml`, `.github/workflows/factory-ci-steward.yml` |
| Review does not repeat | Look for a prior successful `Advisory review and security` job matching the PR, head SHA, base ref, and live base SHA. Authorization success alone does not count. | `.github/workflows/factory-review.yml` |
| An edit does not trigger review | Only base edits authorize a new review; title/body edits use a separate cancellation group. | `.github/workflows/factory-review.yml` |
| A PR command is ignored | Check human author/actor identity, association, both writers' permissions, open state, and same-repository head. Standalone issue commands are deliberately out of scope. | `.github/workflows/factory-mentions.yml` |
| Triage posts nothing | Check its own bot marker, current open state, timestamp drift, result enums, and candidate-number membership. Edited issues do not create a fresh opened event. | `.github/workflows/factory-triage.yml` |
| Steward refuses to start | Only failed/timed-out PR runs of `Automation configuration` qualify here. An existing optional `.github/droid-ci.yml` must be audited before enabling. | `.github/workflows/factory-ci-steward.yml` |
| A hosted action fails despite a present key | Distinguish missing-secret errors, quota/billing failure, App permissions, and actual model failure. An earlier quota failure is recorded, not proof of today's available quota. | `docs/CREDENTIALS.md`, `docs/PROVENANCE.md` |

Use the Actions authorization logs, actual failed job line, review/comment output, and upstream action result. Do not rerun release or deployment workflows as a generic repair attempt.

## Wiki publishing

`.github/workflows/droid-wiki-refresh.yml` can finish generation even when its PR creation step fails. Check the warning annotation, the `droid-wiki` artifact, hidden `.wiki-meta.json`, the actual `factory/droid-wiki` branch, and the rolling PR.

If the next run regenerates everything, check whether previous pages were restored and whether hidden metadata survived artifact upload. Media directories are intentionally excluded from Git. The optional `FACTORY_WIKI_PR_TOKEN` belongs only in the publisher; do not pass it to generation.

The `GITHUB_TOKEN` fallback does not trigger PR workflows. `docs/OPERATIONS.md` specifies a human close/reopen to start those checks. Do not widen or reuse the release token as a workaround.

## Local recurring runs

Read the run record location specified by `automations/COMMON.md` and the installed registration state described in `docs/OPERATIONS.md`.

- A missing/dirty/non-main canonical checkout is a configuration failure. Do not reset it or redirect to an unmerged worktree.
- An offline Mac mini delays local runs; a cloud mirror is not an independent runner.
- Only active schedules can be overdue, and the comparison must use their real cadence and activation date.
- Worker and Intake are deferred, not missed jobs. Old worker branches are legacy claims for a person to inspect.
- Credential failure stops the affected run. Record only credential metadata and the relevant sanitized error.

See [Recurring automations](../features/recurring-automations.md), [Security](../security.md), and [Deployment](../deployment.md) before changing controls to resolve a failure.
