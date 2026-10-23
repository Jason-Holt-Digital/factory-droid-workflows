# Features
Active contributors: Jason

## Purpose

This repository supplies event-driven GitHub Actions wrappers and local scheduled prompt templates, not an application or an implementation queue. The capability map below describes checked-in behavior. Installation and external execution described in `docs/OPERATIONS.md` and `docs/PROVENANCE.md` are historical source records, not independently verified live status.

## Capability map

| Capability | Trigger | Boundary and outcome |
|---|---|---|
| [Code review](code-review.md) | Eligible PR lifecycle events and new heads | Advisory deep review plus security; deduplicated by PR/head/live base identity. |
| [PR commands](pr-commands.md) | Human `@droid` PR comments or reviews | Repository writers only; queued execution rechecks open, same-repository eligibility. |
| [Issue triage](issue-triage.md) | `issues.opened` | One validated classification comment, not implementation authorization. |
| [CI Steward](ci-steward.md) | Failed or timed-out `Automation configuration` PR run | Bounded diagnosis and separately enabled fixes; native upstream handles live PR/head behavior. |
| [Wiki refresh](wiki-refresh.md) | Push to `main` | Read-only generation followed by a separate rolling-PR publisher. No enable variable. |
| [Recurring automations](recurring-automations.md) | Weekly Health/Digest; monthly Readiness | Local native runs with bounded work and private run evidence. |
| Deferred Worker and Intake | No approved active schedule | Paused registrations with no-op prompts, not dormant implementation permission. |

## Layout and key abstractions

- `.github/workflows/` holds six YAML files: five hosted capabilities and validation CI.
- `automations/` holds six Markdown files: shared runtime rules, three recurring tasks, and two deferred no-ops.
- `config/jhd.json` declares organization policy. Hosted workflows repeat fixed guards rather than loading this JSON at runtime.
- A feature switch permits a run; it does not prove an observable outcome. Prepared, configured, and verified are distinct states.
- Human release, tag, publication, store-upload, and production decisions remain outside automation authority.

## Integration and modification entry points

Start with the individual capability page before changing a workflow or prompt. Update duplicated policy deliberately, preserve authorization before credentialed execution, and use the [testing guide](../how-to-contribute/testing.md). Activation and canaries belong to [deployment](../deployment.md), not ordinary documentation or local validation.

Modern review, mentions, triage, and Steward have explicit `JHD_FACTORY_*` gates. Wiki push activation is different: merging its workflow onto the default branch activates it. Local recurring prompts read `automations/COMMON.md` at runtime; those instructions are documentation inputs here and were not executed to generate this wiki.

## Key source files

| Source | Role |
|---|---|
| `README.md` | Inventory, rollout vocabulary, and local checks. |
| `docs/OPERATIONS.md` | Cadences, activation controls, canaries, and recovery. |
| `docs/PROVENANCE.md` | Action provenance and historical verification limits. |
| `config/jhd.json` | Thirteen repository declarations, source ownership, and budgets. |
| `.github/workflows/validate.yml` | Shared validation workflow watched by this repository's Steward. |
| `automations/COMMON.md` | Canonical checkout, trust, release limits, and evidence contract. |

## Scope and evidence

The automation domain contains 12 source files: six workflows plus six prompts. Four shared test files under `tests/` give a structural test-file/source-file ratio of 4/12, or 33.3%, not line coverage or independent coverage for every capability. In particular, no dedicated wiki-publisher test suite exists.

Shared validation already reported 24 Python tests and 101 Node tests passing; that is local wrapper/policy evidence, not hosted execution. The surveyed `origin/main` history has one human author, Jason Holt; bot coauthors are excluded. That repository-wide one-human history is not evidence of independent ownership for each workflow.
