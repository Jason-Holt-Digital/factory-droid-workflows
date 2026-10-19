# Provenance

What the setup is built from and what has been proven. Dates are 2026-10-19 unless stated.

## Pinned actions

| Action | Version | Commit |
|---|---|---|
| `Factory-AI/droid-action` | v10 | `ec767fcf5fac43b64e746cd42bb398b3b0b529ed` |
| `actions/checkout` | v5 | `fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09` |

Workflows reference the commit, with the version in a comment.

## Corrections to the official templates

- Add `synchronize` to the pull request triggers, so each new head is reviewed.
- List trusted bots by name. Never use a wildcard.

The review, mention, and CI Steward workflows are opt-in through the repository variables `JHD_FACTORY_REVIEW_ENABLED`, `JHD_FACTORY_MENTIONS_ENABLED`, `JHD_FACTORY_STEWARD_ENABLED`, and `JHD_FACTORY_STEWARD_FIX_ENABLED`. Each job runs only when its variable is `true`.

## Official action

The workflows use the official upstream `Factory-AI/droid-action` v10 at the pinned commit above, unchanged. Jason approved its standard CI behavior on 2026-10-19. There is no fork.

## Workflow coverage

- Review with a security pass, and `@droid` mentions: all 11 repositories (22 workflow files).
- CI Steward: six repositories with existing deterministic CI, watching only those workflows. The list is in `docs/OPERATIONS.md`.
- Review runs on the latest head of a same-repository PR, cancels superseded runs, and skips a head that already completed review.
- The workflows are written. They have not yet run against a live PR.

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
- The `icloud_storage_plus` `pub.dev` environment requires a human reviewer. Its approval canary has not run.
- Tome Keeper's existing release setup is unchanged.
- AutoWiki and extraction of the overlay are deferred and outside this rollout.
- No real or test package publication has been launched.

## Not yet proven

Linear JHD intake, Sentry writeback, Slack alerts, hosted Factory preview features, Release Please credential execution, the `pub.dev` approval canary, live runs of the new review, mention, and CI Steward workflows, CI Steward repair, native Flutter QA, and every native automation are not verified. Five local native automations are installed and paused. Their state is tracked in `Jason-Holt-Digital/jhd-skills` issue #1.

The existing parser review action reached Factory on PR #8 but failed: weekly standard usage limit reached and Extra Usage balance empty. This is an observed service limit, not a credential-presence failure.
