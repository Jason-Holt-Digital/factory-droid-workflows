# CI Steward
Active contributors: Jason

## Purpose

`.github/workflows/factory-ci-steward.yml` hands eligible deterministic CI failures to the pinned native CI Steward. In this repository it watches **only `Automation configuration`**, the workflow defined in `.github/workflows/validate.yml`. Other repositories' watched workflows listed in `docs/OPERATIONS.md` are not this wrapper's allowlist.

## Controls and budgets

| Control | Meaning |
|---|---|
| `JHD_FACTORY_STEWARD_ENABLED == 'true'` | Enable diagnosis eligibility. |
| `JHD_FACTORY_STEWARD_FIX_ENABLED == 'true'` | Separately permit native auto-fix. |
| `retry_mode: smart`, `max_retries: "1"` | At most one retry. |
| `max_fix_attempts: "2"` | Native fix-attempt bound corresponding to policy's two-fix-commit ceiling. |
| `max_runs_per_pr: "10"` | Ten native invocations per PR. |

`config/jhd.json` independently declares `max_retries: 1`, `max_fix_commits: 2`, and `max_invocations: 10`. These JSON values do not dynamically configure the action inputs. Both declarations must stay aligned.

## Walkthrough

1. A completed watched `workflow_run` must have original event `pull_request`, same-repository head, and conclusion `failure` or `timed_out`. Success, cancellation, push runs, forks, and disabled diagnosis do not qualify.
2. Authorization checks the original run actor, original rerunner, current event actor, and current rerunner. Each must be a current repository writer/admin or exactly `factory-droid[bot]`; other bots are rejected.
3. The script looks for `.github/droid-ci.yml` on the default branch. Its presence fails authorization pending an audit, because v10 drops explicit default-valued budget/false overrides and optional config could widen bounds. Only a 404 is accepted as absence; other API errors propagate.
4. The execution job requires `FACTORY_API_KEY`, checks out the event's `head_branch` with full history and no saved credentials, and configures the environment-backed `gh` Git helper.
5. Pinned v10 receives `ci_steward: "true"`, the separate auto-fix switch, fixed budgets, and instructions to diagnose actual failed logs before proposing changes.

Authorization and execution each serialize by the first associated PR number, falling back to the event branch when associations are absent. Neither group cancels an active job. Execution has a 60-minute timeout.

## Upstream boundary

Unlike [Code review](code-review.md), this wrapper does not fetch the live PR or validate a current head SHA itself. It accepts present, empty, or missing PR associations and delegates PR discovery, live-head handling, and native retry/fix behavior to upstream v10. Checkout uses the event branch, not a locally validated immutable head. The tests explicitly preserve this handoff; do not document it as an additional local stale-head safeguard.

The App token is used for native fix pushes so they can trigger CI and review. No publishing or release credentials are passed. The wrapper's execution job does have Actions, contents, PR, issues, and ID-token write permissions, which is why authorization and bounded upstream behavior matter.

## Limits and modification entry points

Instructions prohibit repair/rerun of AI, security-policy, release, publishing, and deployment workflows; deleting tests; weakening checks; changing workflows or publishing/security policy; tags; releases; publication; and deployment. Exhausted attempts must escalate with the failing check and evidence. These are instructions to the upstream agent, not a local deterministic implementation of every budget or prohibition.

Change the workflow allowlist, its instruction text, and `.github/workflows/validate.yml` naming consistently. Update budget inputs, JSON policy, validator expectations, and regression tests together. An optional `.github/droid-ci.yml` requires explicit audit, not removal of the absence guard just to make a run proceed. See [Deployment](../deployment.md) for diagnosis-first canaries and separate repair approval.

## Key source files

| Source | Role |
|---|---|
| `.github/workflows/factory-ci-steward.yml` | Eligibility, identity/config guards, native handoff, and budgets. |
| `.github/workflows/validate.yml` | Actual watched deterministic CI. |
| `tests/test_workflow_authorization.cjs` | Actor, trigger, optional-config, association, checkout, and helper tests. |
| `tests/test_validate.py` | Shared JSON budget and feedback-loop constraints. |
| `config/jhd.json` | Declarative policy bounds. |

Scope: one Steward workflow plus one watched CI workflow; two relevant shared test files give a 2/2 structural ratio, not 100% coverage or independent verification of upstream repair. Surveyed `origin/main` history has one human author, Jason Holt, repository-wide. `docs/PROVENANCE.md` records hosted repair as unverified at preparation time; no live re-verification is claimed here.
