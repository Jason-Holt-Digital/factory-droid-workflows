# Operations

All five automations run as **local** native Factory scheduled automations on the Mac mini. They use the Mac mini's own `gh` login and DroidProxy model. Factory's hosted preview returning 403 does not affect these local runs.

`{{CONTROL_ROOT}}` is the canonical clone of this repository on the Mac mini, on `main`. Repository `path` values in `config/jhd.json` are relative to the parent directory of `{{CONTROL_ROOT}}`.

## Automations

Schedules are cron expressions in UTC.

| Automation | Prompt | Schedule (UTC) | Model and effort | State |
|---|---|---|---|---|
| Intake | `automations/intake.md` | `7 * * * *` (hourly) | `custom:droidproxy:gpt-6.1-sol`, high | prepared |
| Worker | `automations/worker.md` | `*/15 * * * *` | `custom:droidproxy:gpt-6.1-sol`, high | prepared |
| Readiness | `automations/readiness.md` | `0 3 * * 1` (Monday) | `custom:droidproxy:gpt-6.1-sol`, high | prepared |
| Health | `automations/health.md` | `0 3 * * 3` (Wednesday) | `custom:droidproxy:gpt-6.1-sol`, high | prepared |
| Digest | `automations/digest.md` | `30 7 * * *` (daily) | `custom:droidproxy:gpt-6.1-sol`, high | prepared |

The worker, readiness, and health prompts start nested `droid exec` runs at xhigh effort for hard remediation. Each nested run is a new session with an explicit `--auto` level. A resumed session keeps its original autonomy level even when a higher `--auto` is passed.

## Install

1. Fast-forward `{{CONTROL_ROOT}}` to `main` and run the validation commands in the README.
2. For each row above, create the automation with `CreateAutomation`:
   - `executionLocation: "local"`, `trigger: "schedule"`, `status: "paused"`
   - `name`: `JHD <Automation>`, for example `JHD Intake`
   - `schedule`, `model`, and `reasoningEffort` from the table
   - `prompt`: the prompt file's text with every `{{CONTROL_ROOT}}` replaced by the absolute path
3. Record each returned automation ID in the status issue. IDs are not secret, but they belong in the private status issue, not here.

Every automation starts paused. It stays paused until the infrastructure PRs merge and its canary passes.

## Workflows

Each of the 11 repositories gets two workflows: native review with a security pass (`factory-review.yml`) and `@droid` mentions (`factory-mentions.yml`). Six repositories also get CI Steward (`factory-ci-steward.yml`), which watches only their existing deterministic build and test workflows:

| Repository | Watched workflows |
|---|---|
| `MythicGME2e` | Quality |
| `mythic_gme_apps` | Quality, Mythic Campaign Repository, Agent Readiness Gates |
| `tome_keeper` | Quality |
| `mythic-dice-parser` | Dart |
| `broken-empires-creator` | CI |
| `factory-droid-workflows` | Automation configuration |

The other five repositories have no deterministic CI to watch, so they get no CI Steward workflow. Existing product CI and release workflows are unchanged.

## Activation requirements
These must be true before the matching piece is switched on.

- **Official Droid action workflows.** `FACTORY_API_KEY` is stored as a repository secret, and the workflow's repository variable is `true`. The workflows use the official `Factory-AI/droid-action` v10 at its pinned commit, unchanged; see `docs/PROVENANCE.md`.- **Sentry source.** A staging Sentry project is mapped to a repository, and Sentry's native GitHub integration is configured and tested on it. In the integration settings, closing a GitHub issue must not resolve the Sentry issue, and assignee and status sync must not override a person's choices. See the [Sentry GitHub integration docs](https://docs.sentry.io/organization/integrations/source-code-mgmt/github/).
- **Linear source.** A separate JHD Linear connection exists alongside the Artwod one, and its workspace and teams are verified.
- **Automatic merge.** `automerge` stays `false` for every repository until that repository is `verified` and its deployment side effects are audited.

## Canary and activation

Activate one automation at a time, in this order: digest, intake, worker, health, readiness.

1. Label a nonproduction test issue `automation:canary` in `mythic-dice-parser` or `mythic_gme_apps` (the pilot repositories).
2. Set the automation to `active` with `EditAutomation` (`executionLocation: "local"`, `status: "active"`).
3. Check the observable result, not the run's exit status:
   - Intake: one GitHub issue per source item, with a backlink, no duplicate on the second run, and one source progress update when the stage changes.
   - Worker: one `automation/worker` branch and one PR for the canary issue, with tests, QA evidence, and an independent review on the current head.
   - Readiness: an official stored report, or the exact error the command returned.
   - Health: at most one small PR with a stated reason.
   - Digest: one updated status issue, not a new one.
4. Change the automation's state to `configured`, then to `verified` after the result is confirmed, in `config/jhd.json` (repositories) or the status issue (automations).

Intake stays paused for a source until that source's state is `verified` in `config/jhd.json`.

## Pause and resume

| Control | Pause | Resume |
|---|---|---|
| Native automation | `EditAutomation` with `status: "paused"` | `status: "active"` |
| One issue | Add `automation:paused` | Remove the label |
| Review workflow | Repository variable `JHD_FACTORY_REVIEW_ENABLED` unset or `false` | `true` |
| `@droid` mentions | `JHD_FACTORY_MENTIONS_ENABLED` unset or `false` | `true` |
| CI Steward diagnosis | `JHD_FACTORY_STEWARD_ENABLED` unset or `false` | `true` |
| CI Steward fixes | `JHD_FACTORY_STEWARD_FIX_ENABLED` unset or `false` | `true` after the steward canary |

The four variables are opt-in. A workflow runs its Droid job only when its variable is exactly `true`; an unset variable means off. Legacy Factory workflows stay enabled until their replacement is verified in the same repository; then disable only the superseded Factory job. Product CI, release, and deployment jobs are never disabled by this rollout.

## Recovery

- **Mac mini offline or asleep.** Local runs do not happen and nothing moves to another machine. When the Mac mini returns, the next scheduled run resumes. The digest reports the gap from the age of the newest run record.
- **Worker stopped before opening a PR.** The `automation/worker` branch stays, so no other issue starts in that repository. The next worker run labels the issue `automation:blocked` and comments. A person decides whether to continue or abandon the branch.
- **Open PR failing CI.** CI Steward is the only automatic fixer. The worker does not push to a PR after opening it.
- **Source conflict or cancellation.** The automation adds `automation:paused` and comments on the GitHub issue. A person resolves it in the source system, then removes the label.
- **Credential failure.** The run stops and records a configuration failure naming the credential, never its value. See `docs/CREDENTIALS.md`.
- **CI Steward exhausted.** The steward stops at its limits in `config/jhd.json` and escalates on the PR with the failing log excerpt.

## Run records

Each run writes a short Markdown record to `{{CONTROL_ROOT}}/local-evidence/runs/<automation>/<UTC timestamp>.md`. The folder is gitignored. Records hold outcomes, links, and `NOT_RUN` reasons. They never hold secrets, tokens, private source text, or raw logs. The digest reads them.

## Human-only actions

People perform every release PR merge, release tag, package publication, app-store upload, and production deployment. The `icloud_storage_plus` `pub.dev` environment requires the `kingdomseed` reviewer with admin bypass off; its approval canary has not run yet.
