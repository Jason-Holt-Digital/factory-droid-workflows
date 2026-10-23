# PR commands
Active contributors: Jason

## Purpose

`.github/workflows/factory-mentions.yml` delegates authorized human `@droid` commands to the native action. It accepts PR issue comments, inline review comments, and submitted reviews. Standalone issues are not an implementation or full-security-scan entry point.

## Authorization and queue

`JHD_FACTORY_MENTIONS_ENABLED` must equal `true`. The comment/review must contain `@droid`; its author must equal the event actor, have GitHub type `User`, and have `OWNER`, `MEMBER`, or `COLLABORATOR` association. Association alone is not enough: the authorization script checks current repository `write` or `admin` permission for both actor and rerunner.

There is no bot bypass, including for `factory-droid[bot]`. Bot review output cannot recursively authorize commands. An ordinary issue comment is rejected after identifying that the issue is not a PR.

Authorized work enters a PR-number concurrency group with `cancel-in-progress: false` and `queue: max`. **Inside the queued execution job**, a fresh PR read verifies that it is still open and its head repository still matches the current repository. Every later execution step is conditioned on that check. A PR closing while queued therefore suppresses key checks, checkout, credential-helper setup, and native execution.

## Walkthrough

For a repository writer posting `@droid review` on an open same-repository PR:

1. The event/author checks and both permission lookups pass.
2. The command waits behind any earlier command for that PR.
3. The execution job rereads the PR and sets its own eligibility output.
4. It requires `FACTORY_API_KEY` and checks out the trusted default branch, not the commented-on PR's code, with `persist-credentials: false`.
5. `gh auth setup-git --hostname github.com --force` configures an environment-backed helper.
6. Pinned v10 handles the native command, using deep review and advisory security settings within a 60-minute timeout.

The wrapper recognizes the mention; it does not implement a local command parser or promise a complete list of upstream commands. PR titles, issue bodies, diffs, and logs are context, never shell interpolation or alternative command authorization.

## Credential boundary

The wrapper does not pass `github_token`, `GITHUB_TOKEN`, or `GH_TOKEN` as action overrides. The native action supplies its GitHub App token; the configured helper resolves it from the environment during native execution. Setup does not store a token or make a credential available before the action supplies one.

The job has `contents: read`, PR/issue/ID-token write, and Actions read permissions. That wrapper permission declaration should not be confused with the native App's separate push capability.

## Integration and modification entry points

Edit event guards and the queued recheck in `.github/workflows/factory-mentions.yml` together. Keep all execution steps behind `steps.check.outputs.eligible`. Preserve trusted checkout and the helper's position immediately before the action. `tests/test_workflow_authorization.cjs` executes embedded scripts, emulates step conditions, and uses isolated temporary Git configuration with fake token canaries.

See [Code review](code-review.md) for automatic PR/head review and [Security](../security.md) for the wider trust model. Issue classification belongs to [Issue triage](issue-triage.md), not mentions.

## Key source files

| Source | Role |
|---|---|
| `.github/workflows/factory-mentions.yml` | Human-only gate, queue, fresh PR check, and native action handoff. |
| `tests/test_workflow_authorization.cjs` | Actor/rerunner, bot-loop, queued-close/fork, and credential-helper regression checks. |
| `docs/OPERATIONS.md` | Opt-in activation and controlled legacy cutover. |

Scope: one workflow file; one shared test file gives a 1/1 structural ratio, not 100% test coverage. That suite also serves review and Steward, so its test count cannot be assigned independently to mentions. Surveyed `origin/main` history has one human author, Jason Holt, repository-wide. The operating documents record historical preparation; this page does not independently verify live command execution.
