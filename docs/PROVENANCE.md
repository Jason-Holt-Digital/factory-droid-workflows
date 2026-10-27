# Provenance

What the setup is built from and what has been proven. Dates are 2026-10-19 unless stated.

## Pinned actions

| Action | Version | Commit |
|---|---|---|
| `Factory-AI/droid-action` | v10 | `ec767fcf5fac43b64e746cd42bb398b3b0b529ed` |
| `actions/checkout` | v5 | `fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09` |
| `actions/github-script` | v8 | `ed597411d8f924073f98dfc5c65a23a2325f34cd` |

The review, mention, Steward and Triage wrappers reference commits, with versions in comments. AutoWiki preserves the current official installer template, including its `@v4` checkout/artifact references and pinned `create-pull-request` v8.1.1 commit `5f6978faf089d4d20b00c7766989d076bb2fc7f1`.

## Corrections to the official templates

- Add `synchronize` to the pull request triggers, so each new head is reviewed until the first review succeeds.
- Review once per PR: a successful review adds the `droid-reviewed` label, and labelled PRs are skipped except CI Steward fix pushes.
- List trusted bots by name. Never use a wildcard.
- Run Code Review on `claude-sonnet-5-5` through the `ANTHROPIC_API_KEY` secret. A workflow step writes the custom model to `~/.factory/settings.json`, because the action's `settings` input writes `~/.factory/droid/settings.json`, which Droid does not read for custom models (still true in v12). If the model fails to load, the action reruns on the organization default and posts a `MODEL_FALLBACK_NOTE` in the tracking comment.

Review, mentions, Triage and CI Steward are opt-in through `JHD_FACTORY_REVIEW_ENABLED`, `JHD_FACTORY_MENTIONS_ENABLED`, `JHD_FACTORY_TRIAGE_ENABLED`, `JHD_FACTORY_STEWARD_ENABLED`, and `JHD_FACTORY_STEWARD_FIX_ENABLED`. AutoWiki replaces the official default-branch push trigger with manual runs only; merging its setup PR is activation, not a gated dry run.

## Official action

The workflows use the official upstream `Factory-AI/droid-action` v10 at the pinned commit above, unchanged. Jason approved its standard CI behavior on 2026-10-19. There is no fork.

## Workflow coverage

- Review with a security pass, and `@droid` mentions: all 13 repositories (26 workflow files).
- Issue Triage: 13 classification-only workflows using the official pinned `Factory-AI/droid-action/base-action`, with restricted local tools and a separate validated comment job. This is JHD configuration, not the scheduled Slack Triage package.
- AutoWiki: twelve official-template workflows added to existing setup PRs; Mythic's existing PR #1921 already has the current template and is reused unchanged. All restore the rolling wiki, preserve hidden metadata, exclude media, and run publication in a separate job. Generation later gained `contents: write` so `/wiki` can push the GitHub wiki (approved by Jason, 2026-10-23).
- CI Steward: six repositories with existing deterministic CI, watching only those workflows. The list is in `docs/OPERATIONS.md`.
- Review rejects stale PR head SHAs and changed base branch refs. A base branch that advances to a new commit does not suppress review. Completed-review deduplication uses the live PR head SHA, base ref, and base SHA. The workflow cancels superseded runs and skips a matching completed review.
- Opt-in jobs on the setup PRs are skipped. Hosted Factory execution remains unverified.

## Added repositories

- `jhd-astro`: 30 Vitest tests passed. Astro checked 94 files with zero errors, warnings, or hints. The production build completed with 177 pages. Existing npm audit findings remain: two high and two moderate; no dependency changes were made.
- `ac-deck-builder`: 24 unit and widget tests passed in `prototypes/ac_deck_prototype` after dependency resolution and ignored localization generation, using Flutter 3.47.7 and Dart 3.13.5. Native-device QA remains `NOT_RUN`.
- The website transfer preserved repository identity and `main` history. Cloudflare's saved connection targets the organization repository, with builds paused and the encrypted build secret verified after reload. The existing production version remained active and the homepage returned HTTP 200. No deployment was launched.

## QA pilot

- `mythic_gme_apps`, run `pilot-20261019-145019-99558` on the Mac mini, at commit `e624dcca72ef963f93ab21119bab517672ab2b4a` with Dart 3.13.5.
- The command-line app was built with `dart build cli` as a local bundle, not a release artifact.
- 25 command-line cases passed, including the Vault Workshop terminal UI driven through droid-control `tctl`.
- `NOT_RUN`: the native Flutter apps (`mythic_gme_app`, `mythic_dice_app`) on every platform, Wear OS, and the Workshop on Linux or in CI.
- No QA workflow exists yet.

## Local model

`custom:droidproxy:gpt-6.1-sol` ran smoke executions at high and at xhigh effort on the Mac mini. Both passed.

## Readiness report

- `/readiness-report` exists in the installed Droid CLI.
- `droid exec --cwd <repo>` alone did not change the directory the slash command ran in. Always `cd` into the repository in the shell as well.
- `mythic-dice-parser`: the official report is stored (report ID `44988128-6272-4c40-a384-e410545c9584`). Result: Level 2, 37.3%, 25 passed, 42 failed, 17 skipped. Session settings show `custom:droidproxy:gpt-6.1-sol` at high effort.
- In that run, the local tests and CLI checks were blocked by permissions and are `NOT_RUN`. The score is a readiness assessment, not runtime QA.
- That report started at `--auto low` and was resumed with `--auto medium`. It succeeded, but the resumed session kept low autonomy. Future reports run as new sessions with an explicit `--auto medium`.
- `mythic-dice-parser` readiness fix: the official `/readiness-fix` loaded the stored 2026-10-19 report and ran with `custom:droidproxy:gpt-6.1-sol` at xhigh, with Opus writing the prose. It changed only `README.md`, published as PR #8. Shell syntax in the diff was checked. Its existing Dart build job passed on GitHub. This is readiness remediation, not functional runtime QA.

## Releases

- Five Release Please setups are open as draft PRs: `MythicGME2e` #1948, `mythic_gme_apps` #126, `icloud_storage_plus` #49, `mythic-dice-parser` #7, and `jhd-jaspr` #1. Their 19 offline verification groups passed. Real credentials and publishing are not proven.
- The `icloud_storage_plus` `pub.dev` environment requires a human reviewer with admin bypass off. Its approval canary reached the human-approval wait with zero executed steps, then was cancelled without approval. This proves the approval gate, not package publication.
- Tome Keeper's existing release setup is unchanged.
- AutoWiki is included; extraction of the overlay stays deferred.
- No real or test package publication has been launched.

## Not yet proven

Linear JHD intake, Sentry writeback, Slack alerts, hosted Factory preview features, Release Please credential execution, live runs of the new review, mention, Triage, wiki and CI Steward workflows, CI Steward repair, native Flutter QA, and every native automation are not verified. Health and Digest are weekly, Readiness is monthly and assessment-only, and the two former Worker/Intake registrations are retained paused with no-op deferred prompts. All five registrations remain paused. Their state is tracked in `Jason-Holt-Digital/jhd-skills` issue #1.

No dedicated wiki PR token exists. With Jason's approval, GitHub Actions PR creation was enabled in `jhd-astro` and `Mythic-Source-Materials`, and both settings were read back with default token permissions unchanged at read-only. All thirteen repositories can use the official fallback, but a person must close and reopen fallback-created wiki PRs for their checks. No secret scope changed.

The existing parser review action reached Factory on PR #8 but failed: weekly standard usage limit reached and Extra Usage balance empty. This is an observed service limit, not a credential-presence failure.
