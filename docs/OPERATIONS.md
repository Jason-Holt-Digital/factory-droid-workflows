# Operations

## Agreed operating model

Code Review, issue Triage, and bounded CI repair run on events, not polling schedules. AutoWiki runs only when started by hand from the Actions tab. Weekly Health and Digest and monthly Readiness run as local native Factory automations on the Mac mini. Ticket-to-PR and recurring source Intake are deferred.

These frequencies are JHD choices for a low-volume organization, not Factory Readiness requirements.

| Automation | Starts when | Required outcome |
|---|---|---|
| Code Review | Eligible PR without the `droid-reviewed` label | One review with a security pass per PR; the label marks it done. CI Steward fix pushes are still reviewed. Comment `@droid review` for another one (needs `JHD_FACTORY_MENTIONS_ENABLED`). |
| AutoWiki | A manual run from the Actions tab | Refresh the Factory wiki and open or update one reviewable `factory/droid-wiki` PR containing generated pages and metadata. |
| Issue Triage | New GitHub issue | One comment classifying it, suggesting related work and a human route. No implementation or ready label. |
| CI Steward | An allowlisted deterministic CI workflow fails | Diagnose it; at most one retry and two fix commits, with ten invocations per PR. |
| Health | Weekly | At most one justified maintenance PR across the organization. No work if no useful fix exists. |
| Digest | Weekly | Update one private status issue covering the previous seven days and decisions waiting for a person. |
| Readiness | Monthly | Official stored assessments for at most two rotating repositories, with prioritized findings. No remediation. |

Factory references: [Code Review](https://docs.factory.ai/software-factory/code-review-ci), [AutoWiki](https://docs.factory.ai/software-factory/wiki/auto-refresh), [Triage](https://docs.factory.ai/software-factory/triage), [Automations](https://docs.factory.ai/software-factory/automations), and [Readiness](https://docs.factory.ai/agent-readiness/readiness-report).

## Scheduled automations

Cron expressions are UTC. The default days and times preserve the earlier Health time and use Monday for the weekly Digest and the first day of the month for Readiness.

| Automation | Prompt | Schedule (UTC) | Status during preparation |
|---|---|---|---|
| Health | `automations/health.md` | `0 3 * * 3`, Wednesday 03:00 | paused |
| Digest | `automations/digest.md` | `30 7 * * 1`, Monday 07:30 | paused |
| Readiness | `automations/readiness.md` | `0 3 1 * *`, first day 03:00 | paused |
| Ticket-to-PR | `automations/worker.md` | none approved | deferred, retained paused |
| Source Intake | `automations/intake.md` | none approved | deferred, retained paused |

All use `custom:droidproxy:gpt-6.1-sol` at high effort. Readiness rotates a bounded two-repository batch each month, not every repository every month. Its `/readiness-report` sessions are new sessions with explicit `--auto medium`. `/readiness-fix` is a separate human-approved task.

The two deferred local registrations retain a weekly parking cron because native registrations require one. They stay paused and their replacement prompts stop without external writes, even if started manually. Do not resume them. The previous 15-minute Worker and hourly Intake behavior is removed, not merely hidden behind a pause.

The local registrations also appear in the cloud list. They are mirrors, not independent schedules. `ReadAutomation` uses the local slug for local reads and the cloud ID for cloud reads. Local `EditAutomation` supports prompts, names, models and status, but not cadence. For a cadence correction, edit only the existing `schedule:` field in its `HEARTBEAT.md`, keep `paused: true`, and verify the local and mirrored readbacks. Do not create a second registration to change the cadence.

## Canonical runtime prerequisite

`{{CONTROL_ROOT}}` is the canonical clone of this repository on the Mac mini, on `main`. Paths in `config/jhd.json` are relative to its parent directory. Installed prompts replace `{{CONTROL_ROOT}}` with that absolute path. `COMMON.md` is read at run time.

Before a normal run:

1. A person reviews and merges the central setup PR.
2. Fast-forward the clean canonical clone to `main` and run the README checks.
3. Confirm `automations/COMMON.md` and `config/jhd.json` exist there. A setup worktree is not the canonical runtime.
4. Install or update only the three recurring prompts above with `status: paused`, and read them back. Keep the deferred registrations paused.
5. Run bounded canaries before resuming schedules.

No normal automation run is ready while its canonical policy files are missing. Do not point it at an unmerged setup branch to conceal that prerequisite.

## Event-driven workflows

All 13 repositories have gated review and human `@droid` PR-command wrappers. These replacement wrappers limit commands to open, same-repository PRs and human repository writers. They do not implement issue mentions; Ticket-to-PR is deferred. Legacy issue responders still need the controlled cutover below.

### AutoWiki

Use the current official `/install-wiki` template, including fixed repository-wide concurrency, full history, restoring `droid-wiki/` from `factory/droid-wiki`, and hidden metadata in the artifact. The generation job is read-only. Only the separate publish job receives write permissions and an optional `FACTORY_WIKI_PR_TOKEN`. Media is excluded from Git.

Mythic's existing setup is PR #1921. It already contains these settings and is reused unchanged. The other twelve repositories receive the same template in their existing setup PRs. Do not open a duplicate Mythic wiki workflow.

**The wiki workflow runs only when started by hand** from the Actions tab; each run is a paid Droid session. To have Factory also publish to the GitHub wiki, create the first wiki page by hand at `https://github.com/{owner}/{repo}/wiki` once; Factory cannot push to an uninitialized wiki.

`FACTORY_API_KEY` already exists at organization scope for all repositories. No `FACTORY_WIKI_PR_TOKEN` was present in organization or repository secret metadata at preparation time. Do not reuse or widen `RELEASE_PLEASE_TOKEN`.

The approved publishing path is the official `GITHUB_TOKEN` fallback. Jason approved enabling Actions PR creation in `jhd-astro` and `Mythic-Source-Materials`; both settings were read back as enabled with default token permissions still read-only. GitHub combines PR creation and approval in this repository setting; no workflow was granted a task to approve or merge PRs. No secret was created or widened.

Fallback-created PRs do not trigger other workflows. A person must close and reopen the wiki PR to start its checks. A dedicated fine-grained wiki token remains an optional future change requiring approval, not a prerequisite for this fallback path.

A green generation job or warning-only publish failure does not verify the rolling-PR outcome. Inspect the actual PR, `.wiki-meta.json`, media exclusions, and next incremental update.

### Issue Triage

`factory-triage.yml` is a JHD classification workflow using the official pinned Droid Exec Base Action. It is not the scheduled Slack `/install-triage` package and is not Ticket-to-PR.

It reads the new issue, comments, and the 100 most recently updated issues/PRs from that same repository. A read-only-token job lets the model use only file reads, searches and a local patch tool to write a classification JSON file. It has no shell or connector tools. Before uploading the artifact, a deterministic step removes all free text and extra fields, retaining only fixed category values and numbers from that candidate list. A separate issue-write job validates those fields again and posts one bounded comment to the original issue. It does not execute model output, change labels or assignees, close issues, or grant ready status. If the issue changed or closed during classification, publication stops.

Start with one repository when enabling it. A bounded candidate search cannot prove there are no older duplicates. Edited issues do not create new runs; an operator may rerun a missed classification. Linear and Sentry source enrollment and writeback remain separate, unverified prerequisites, not hidden hourly polling.

Use a private repository for the pilot. Public issue authors can start paid runs once Triage is enabled there. Tool allowlisting is not a filesystem sandbox; keep the pilot bounded and inspect its artifacts and comment before expanding.

### CI Steward

Only six repositories have deterministic GitHub CI to watch:

| Repository | Watched workflows |
|---|---|
| `MythicGME2e` | Quality |
| `mythic_gme_apps` | Quality, Mythic Campaign Repository, Agent Readiness Gates |
| `tome_keeper` | Quality |
| `mythic-dice-parser` | Dart |
| `broken-empires-creator` | CI |
| `factory-droid-workflows` | Automation configuration |

The other seven receive no CI Steward workflow. Steward does not watch AI, release, publishing, deployment, or security-policy workflows. Diagnosis and fixes have separate enable variables.

## Activation controls

| Control | Off | On, after a bounded canary |
|---|---|---|
| Health, Digest, Readiness | Native status `paused` | Native status `active` |
| Ticket-to-PR, source Intake | Deferred and paused | Not authorized in this phase |
| Code Review | `JHD_FACTORY_REVIEW_ENABLED` unset or `false` | `true` |
| Human PR commands | `JHD_FACTORY_MENTIONS_ENABLED` unset or `false` | `true` |
| Issue Triage | `JHD_FACTORY_TRIAGE_ENABLED` unset or `false` | `true`, one pilot first |
| CI Steward diagnosis | `JHD_FACTORY_STEWARD_ENABLED` unset or `false` | `true` |
| CI Steward fixes | `JHD_FACTORY_STEWARD_FIX_ENABLED` unset or `false` | `true` after repair proof |
| AutoWiki | Setup PR unmerged, or workflow disabled | Merge allows manual runs |

Review, mentions and Steward use the unchanged official `Factory-AI/droid-action` v10 at the pinned commit in `docs/PROVENANCE.md`. Factory App access and credential availability are required but do not prove hosted execution. Keep all repository `automerge` values false.

Legacy responders remain until a replacement is proven, but do not leave both responding to the same event after cutover. Disable only a superseded Factory job, never product CI or release/deployment jobs.

## Activation sequence

Verify available Factory quota before a paid execution. Do not activate on a guessed reset time.

1. Review the central setup and explicitly approve its AutoWiki activation before merging: that PR includes the central repository's wiki workflow too. Prepare the canonical runtime as above.
2. Confirm the affected repository can actually start GitHub Actions jobs after the CI budget change. A zero-step billing failure proves nothing about Factory or Sentry credentials.
3. Canary Code Review on one same-repository PR/head. Confirm a real posted review, then cut over that repository's legacy responder.
4. Canary one issue classification. Expect one bounded comment, no implementation or label changes, and no second comment on rerun.
5. Approve AutoWiki activation and its publishing credential/permission path. Merge one wiki setup, start one manual run, and observe one rolling wiki PR, then an incremental update with preserved metadata.
6. Canary CI Steward with one eligible nonproduction failure. Verify diagnosis before separately enabling bounded repairs.
7. Canary Digest against the known private status issue, Health against one named repository, and Readiness against one named repository. Keep their schedules paused during each manual canary.
8. Resume only the three recurring automations whose outcomes passed and whose activation is approved. Leave Ticket-to-PR and Intake deferred.

For a local canary, read and save the installed prompt, append a temporary section naming the exact repository and issue where applicable, forbidding all other targets and every merge, and install it while paused. Use **Run now** in the desktop app. Inspect the result and run record, restore the saved prompt, then read it back. `RunAutomation` does not start local-only automations.

## Source and production ownership

Linear requires the separate verified JHD workspace and team mappings, not the Artwod connection. Sentry requires verified native GitHub linking and feedback. A person closing a GitHub issue must not resolve its Sentry source or overwrite a person's source choices. Do not enable unverified source writeback.

Every release PR merge, tag, package publication, store upload and production deployment remains human-owned. The `icloud_storage_plus` `pub.dev` environment approval canary reached the required-human-approval wait with zero executed steps and was cancelled without approval. That proves the gate, not publication.

The live website is `jhd-astro`, not `jhd-jaspr`. Its Cloudflare Worker is `jhd-astro-web`, connected to organization `main`, with builds paused. The encrypted `TURNSTILE_SECRET_KEY` entry was verified after reload; the matching Formspark form's stored key matched the rotated widget secret. No deployment or support submission was performed. Other shared-widget consumers and real Siteverify consumption remain unverified. Keep builds paused until a person approves resuming them. Existing `npm run build` and `npx wrangler deploy` commands can deploy production on a main push; automatic merge must remain off.

The deck Flutter app lives under `prototypes/ac_deck_prototype`. Dependency and localization preparation precede its tests. Native QA is still unverified. No release setup was changed for either addition; Tome Keeper's existing Release Please configuration stays intact.

## Recovery and evidence

Each recurring run writes `{{CONTROL_ROOT}}/local-evidence/runs/<automation>/<UTC timestamp>.md` with outcomes, links, failures and `NOT_RUN` reasons. The folder is gitignored. Never store secret values, raw private evidence, or recordings in this public repository.

- If the Mac mini is offline, local runs wait for the machine. Digest compares only actual active cadences, not a former worker heartbeat.
- Leave legacy claims for a person; there is no active worker to recover them.
- Credential failures stop the affected run and name only the credential metadata.
- Steward stops at its configured bounds and escalates with the relevant failing line.
- Merged is not released. Released is not verified. Report each observed state.
