# Operations

All five automations run as **local** native Factory scheduled automations on the Mac mini. They use the Mac mini's own `gh` login and DroidProxy model. Factory's hosted preview returning 403 does not affect these local runs.

`{{CONTROL_ROOT}}` is the canonical clone of this repository on the Mac mini, on `main`. Repository `path` values in `config/jhd.json` are relative to the parent directory of `{{CONTROL_ROOT}}`. The installed prompts contain the absolute path in place of `{{CONTROL_ROOT}}`. `automations/COMMON.md` is read at run time and is not rendered; each run takes the control root from the absolute path it used to load `COMMON.md` and binds it in every shell command.

## Automations

Schedules are cron expressions in UTC.

| Automation | Prompt | Schedule (UTC) | Model and effort | State |
|---|---|---|---|---|
| Intake | `automations/intake.md` | `7 * * * *` (hourly) | `custom:droidproxy:gpt-6.1-sol`, high | prepared |
| Worker | `automations/worker.md` | `*/15 * * * *` | `custom:droidproxy:gpt-6.1-sol`, high | prepared |
| Readiness | `automations/readiness.md` | `0 3 * * 1` (Monday) | `custom:droidproxy:gpt-6.1-sol`, high | prepared |
| Health | `automations/health.md` | `0 3 * * 3` (Wednesday) | `custom:droidproxy:gpt-6.1-sol`, high | prepared |
| Digest | `automations/digest.md` | `30 7 * * *` (daily) | `custom:droidproxy:gpt-6.1-sol`, high | prepared |

The worker and readiness prompts start nested `droid exec` runs at xhigh effort for hard remediation. Each nested run is a new session with an explicit `--auto` level. A resumed session keeps its original autonomy level even when a higher `--auto` is passed.

## Install

1. Fast-forward `{{CONTROL_ROOT}}` to `main` and run the validation commands in the README.
2. For each row above, create the automation with `CreateAutomation`:
   - `executionLocation: "local"`, `trigger: "schedule"`, `status: "paused"`
   - `name`: `JHD <Automation>`, for example `JHD Intake`
   - `schedule`, `model`, and `reasoningEffort` from the table
   - `prompt`: the prompt file's text with every `{{CONTROL_ROOT}}` replaced by the absolute path
3. Record each returned automation ID in the status issue. IDs are not secret, but they belong in the private status issue, not here.

Every automation starts paused. It stays paused until the infrastructure PRs merge and its canary passes.

The five local automations also appear in the cloud list as synced registrations. They are not a second set of schedules.

## Workflows

Each of the 13 repositories gets two workflows: native review with a security pass (`factory-review.yml`) and native `@droid` commands on pull requests (`factory-mentions.yml`). A command runs only on an open pull request from a branch in the same repository, and only when a person with write access to the repository wrote the comment or review. A `@droid` comment on an issue starts nothing; issue implementation goes through the local worker queue. The Factory bot cannot author a command; it remains allowed only for automatic review and CI Steward push events. Six repositories also get CI Steward (`factory-ci-steward.yml`), which watches only their existing deterministic build and test workflows:

| Repository | Watched workflows |
|---|---|
| `MythicGME2e` | Quality |
| `mythic_gme_apps` | Quality, Mythic Campaign Repository, Agent Readiness Gates |
| `tome_keeper` | Quality |
| `mythic-dice-parser` | Dart |
| `broken-empires-creator` | CI |
| `factory-droid-workflows` | Automation configuration |

The other seven repositories have no deterministic GitHub CI to watch, so they get no CI Steward workflow. Existing product CI and release workflows are unchanged.

The live `jasonholtdigital.com` website is `jhd-astro`, not `jhd-jaspr`; both repositories remain covered. Astro uses Node 22 and the local checks `npm test`, `npm run check`, and `npm run build`. Its Cloudflare Worker is `jhd-astro-web`.

The website repository was transferred from `kingdomseed` with its repository ID and `main` history preserved. Cloudflare is reconnected to `Jason-Holt-Digital/jhd-astro` on `main`, with builds paused. Its encrypted `TURNSTILE_SECRET_KEY` build entry was restored and verified after a reload. The existing production deployment remains active; this rollout deployed nothing.

Keep builds paused until a person approves resuming them. Once resumed, pushes to `main` use the existing `npm run build` and `npx wrangler deploy` commands. Never enable automatic merges while that path can deploy production without a separate human gate.

The Flutter app in `ac-deck-builder` is under `prototypes/ac_deck_prototype`, not the repository root. Its workflow files under that prototype directory are not root GitHub Actions workflows. Before its documented tests, run `flutter pub get` and `flutter gen-l10n` in that directory to prepare ignored dependencies and translations. Native QA and deployment verification remain required before activation.

Neither addition changes Release Please or enables any Factory variable, schedule, or automatic merge.

## Activation requirements
These must be true before the matching piece is switched on.

- **Official Droid action workflows.** `FACTORY_API_KEY` is available to the repository, the installed Factory GitHub App has access to the repository, and the workflow's repository variable is `true`. The workflows use the official `Factory-AI/droid-action` v10 at its pinned commit, unchanged; see `docs/PROVENANCE.md`.
- **Sentry source.** A staging Sentry project is mapped to a repository, and Sentry's native GitHub integration is configured and tested on it. In the integration settings, closing a GitHub issue must not resolve the Sentry issue, and assignee and status sync must not override a person's choices. See the [Sentry GitHub integration docs](https://docs.sentry.io/organization/integrations/source-code-mgmt/github/).
- **Linear source.** A separate JHD Linear connection exists alongside the Artwod one, and its workspace and teams are verified.
- **Automatic merge.** `automerge` stays `false` for every repository until that repository is `verified` and its deployment side effects are audited.

## Canary and activation

Canary each automation once, in this order: digest, intake, worker, health, readiness. The normal prompts do not filter by the `automation:canary` label, so the label alone constrains nothing. A canary run is constrained only by a temporary prompt that names its targets. The schedule stays `paused` for the whole procedure.

1. Read the automation with `ReadAutomation` (`executionLocation: "local"`) and keep its current prompt, the correctly rendered text with the absolute control root.
2. Write a temporary canary prompt: the original prompt followed by a canary section that binds explicit targets and forbids everything else.
   - Targets: one pilot repository (`mythic-dice-parser` or `mythic_gme_apps`) and, where the automation handles issues or sources, the exact issue number or source IDs.
   - Limit claim, cleanup, merge, source scanning, health checks, and readiness reports to those targets. Do no work on any other repository, issue, or source item.
   - Never merge anything, even when every merge condition is true.
3. Install it with `EditAutomation` (`executionLocation: "local"`, `prompt`), leaving `status: "paused"`.
4. Run it once with the **Run now** control in the Factory desktop app. `RunAutomation` starts only cloud automations and refuses local-only ones.
5. Inspect the real output and the run record. Check the observable result, not the run's exit status:
   - Digest: the canary prompt names the known private status issue; that one issue is updated, and no new issue is created.
   - Intake: needs verified test source identities and a nonproduction staging source in the canary prompt. Expect one GitHub issue per test source item, with a backlink, no duplicate on a second run, and one source progress update when the stage changes. If no such source is available, record intake as `NOT_RUN` with the reason; this does not delay the worker or digest canaries.
   - Worker: the canary prompt names one nonproduction test issue that a trusted person labeled both `automation:ready` and `automation:canary`. Expect one `automation/worker` branch whose claim commit names that issue, and one PR for it with tests, QA evidence, and an independent review on the current head. Nothing is merged.
   - Health: at most one small PR in the named repository, with a stated reason.
   - Readiness: an official stored report for the named repository, or the exact error the command returned. The canary may reuse an official report already stored for that repository; record it as existing evidence, not as a new run.
6. Restore the original prompt with `EditAutomation`, and confirm with `ReadAutomation` that the restored prompt matches the kept text. Leave the automation `paused`.
7. Change the automation's state to `configured`, then to `verified` after the result is confirmed, in `config/jhd.json` (repositories) or the status issue (automations). Set `status: "active"` only when the activation requirements above are met and the canary evidence supports it.

Intake stays paused for a source until that source's state is `verified` in `config/jhd.json`.

## Pause and resume

| Control | Pause | Resume |
|---|---|---|
| Native automation | `EditAutomation` with `status: "paused"` | `status: "active"` |
| One issue | Add `automation:paused` | Remove the label |
| Review workflow | Repository variable `JHD_FACTORY_REVIEW_ENABLED` unset or `false` | `true` |
| `@droid` PR commands | `JHD_FACTORY_MENTIONS_ENABLED` unset or `false` | `true` |
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

People perform every release PR merge, release tag, package publication, app-store upload, and production deployment. The `icloud_storage_plus` `pub.dev` environment requires the `kingdomseed` reviewer with admin bypass off. Its approval canary reached the required-human-approval state with no job steps executed; no approval was granted.
