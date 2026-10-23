# Deployment

Deployment here means activating delivery workflows and local prompts, not deploying an application. Files being merged, credentials being present, and successful offline checks do not prove an automation's required outcome; see [data models](reference/data-models.md).

## Activation boundaries

`docs/OPERATIONS.md` defines the controls below. The event wrappers implement their own variable checks rather than importing `config/jhd.json`.

| Capability | Disabled or preparation state | Activation |
|---|---|---|
| Code review | `JHD_FACTORY_REVIEW_ENABLED` unset or not `true` | Set to `true` after approval and bounded proof |
| Human PR commands | `JHD_FACTORY_MENTIONS_ENABLED` unset or not `true` | Set to `true` |
| Issue triage | `JHD_FACTORY_TRIAGE_ENABLED` unset or not `true` | Set to `true`, initially in one private repository |
| CI Steward diagnosis | `JHD_FACTORY_STEWARD_ENABLED` unset or not `true` | Set to `true` |
| CI Steward repairs | `JHD_FACTORY_STEWARD_FIX_ENABLED` unset or not `true` | Separately set to `true` after repair proof |
| Health, Digest, Readiness | Native registration `paused` | Native registration `active` after its canary |
| Worker and source Intake | Deferred, retained paused with no-op prompts | Not authorized |
| AutoWiki | Setup unmerged, or workflow disabled | Merging the workflow activates its `main` push trigger |

`.github/workflows/factory-review.yml` is the only automatic PR reviewer remaining in this repository after `d8596c0` removed the legacy reusable workflow on October 23, 2026. Its enable variable still applies. This removal does not establish the state of responders in other repositories or prove a successful canary; see [code review](features/code-review.md).

`.github/workflows/droid-wiki-refresh.yml` has no JHD enable variable. Explicitly approve activation before merging its setup, including the central repository's setup. It runs on pushes to `main`, which is the current default branch; its publisher targets the repository's default branch.

## Canonical local runtime

`automations/COMMON.md` and `docs/OPERATIONS.md` require a clean canonical Mac mini clone on `main`, fast-forwarded to `origin/main`, with matching HEAD. A setup branch or worktree is not a substitute for that runtime.

1. Review and merge the central setup with explicit wiki-activation approval.
2. Fast-forward the clean canonical clone and run the checks in `README.md`.
3. Confirm `automations/COMMON.md` and `config/jhd.json` exist there.
4. Replace `{{CONTROL_ROOT}}` in installed prompts with that clone's absolute path. Repository paths resolve relative to its **parent**, not inside the control clone.
5. Install or update only the existing Health, Digest and Readiness registrations while paused, then read them back. Leave Worker and Intake paused.

The native registrations are external state, not files installed by merging this repository. Cloud-list entries mirror local registrations, not independent schedules. Local cadence edits require changing only the existing registration's `HEARTBEAT.md` `schedule:` field, preserving `paused: true`, and checking local and mirrored readbacks; do not create duplicate registrations. Full schedules and rotation rules are in [recurring automations](features/recurring-automations.md).

## Bounded activation sequence

`docs/OPERATIONS.md` requires checking actual Factory quota and the repository's ability to start Actions jobs before paid canaries. A zero-step billing failure proves neither model execution nor credentials.

1. Canary one same-repository PR/head; inspect an actual current-head review. Cut over only that repository's superseded legacy Factory responder after proof.
2. Canary one issue classification. Confirm one bounded comment, no implementation or label changes, and no duplicate comment on rerun.
3. Approve wiki activation and its publishing path. Observe a rolling wiki PR, retained metadata and a subsequent incremental update.
4. Canary one eligible nonproduction CI failure. Verify diagnosis before separately enabling bounded fixes.
5. While schedules remain paused, canary Digest against the known private status issue, Health against one named repository, and Readiness against one named repository.
6. Resume only approved recurring automations with proven outcomes.

For a local canary, save the installed prompt, append an exact-target section forbidding other targets and every merge, install it while paused, and use desktop **Run now**. Inspect evidence, restore the saved prompt and read it back. `RunAutomation` does not start local-only automations. Feature-specific expectations belong in the [feature pages](features/index.md), not a broader production trial.

## Wiki publishing choice

`.github/workflows/droid-wiki-refresh.yml` generates with read-only GitHub permissions, then uses a separate publisher with contents/PR write permissions. The optional `FACTORY_WIKI_PR_TOKEN` reaches only the publisher. Without it, the workflow uses `GITHUB_TOKEN`.

The fallback requires the repository setting permitting Actions-created PRs. PRs opened with that token do not start other workflows; a person must close and reopen the wiki PR to start its checks. `docs/OPERATIONS.md` records approval and readback of that setting in `jhd-astro` and `Mythic-Source-Materials`, with default token permissions still read-only. This is historical evidence, not a fresh settings audit. Do not widen `RELEASE_PLEASE_TOKEN` to avoid the fallback. A dedicated fine-grained wiki token is an optional, separately approved change.

Generation success alone is insufficient: publishing is `continue-on-error` and may leave only a warning. Verify the actual `factory/droid-wiki` PR, `droid-wiki/.wiki-meta.json`, media exclusions and next update. See [wiki refresh](features/wiki-refresh.md).

## Production and recovery

Every release PR merge, tag, package publication, store upload and production deployment remains human-owned under `config/jhd.json` and `automations/COMMON.md`. All 13 repository records remain `prepared`, with `automerge: false` and `deployment_audited: false`.

`docs/OPERATIONS.md` records the live website as `jhd-astro`, its Worker as `jhd-astro-web`, and builds as paused. Existing main-push build/deploy commands can reach production; do not resume builds or enable automatic merges as part of workflow preparation. The recorded `icloud_storage_plus` approval canary proved a human gate with zero executed steps, not publication.

To stop modern event wrappers, unset their enable variable or set it to `false`; pause local registrations. Wiki requires disabling its workflow if already merged. Disable only superseded Factory jobs, never product CI or release/deployment jobs. Missing credentials stop the affected run; exhausted Steward budgets escalate. Leave legacy worker claims for a person instead of resuming or deleting them.

Run records belong under the canonical clone's gitignored `local-evidence/runs/<automation>/<UTC timestamp>.md`, with observed outcomes, links, failures and `NOT_RUN` reasons. `docs/PROVENANCE.md` and `docs/CREDENTIALS.md` record historical preparation and verification gaps; they are not independent live verification. No external activation, deployment or credential change is authorized by this documentation.
