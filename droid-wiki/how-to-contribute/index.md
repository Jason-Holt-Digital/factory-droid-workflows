# Contributing

Treat changes here as changes to automation authority, not just configuration cleanup. `README.md` identifies the public repository's scope, and `docs/OPERATIONS.md` explains which changes activate workflows or require a separate approval.

## Pick up work

Identify whether the change affects JSON policy, a hosted event wrapper, or a local task prompt. Use the [feature map](../features/index.md) to find its implementation, then read the relevant tests. A readiness finding or queue label is not authorization to resume Ticket-to-PR or source Intake; their current boundaries are in `automations/worker.md` and `automations/intake.md`.

There is no checked-in contribution guide, CODEOWNERS file, or PR template. `AGENTS.md` lists the approved coding principles (see [Patterns and conventions](patterns-and-conventions.md)); the workflow below follows the checks and operational constraints that are present, rather than claiming an undocumented branch or approval policy.

## Review expectations

- Keep declared policy and hosted guards consistent. `config/jhd.json` is not automatically loaded by hosted YAML.
- Add regression cases for changed trust checks, budgets, model-result validation, or canonical-checkout behavior.
- Describe the observable result and each skipped check with a reason.
- Keep secret values, private issue text, logs, traces, licensed material, and recordings out of this public repository, as required by `automations/COMMON.md`.
- Distinguish passing local tests from a hosted canary or production verification.

The test entry points are in `README.md` and `.github/workflows/validate.yml`. [Testing](testing.md) explains what they exercise.

## Definition of done

For a code or policy change, run the relevant validator and regression tests, inspect the diff, and document any operational consequence. Do not claim an external installation is verified until its required outcome is observed. `docs/PROVENANCE.md` is the existing evidence record; `docs/OPERATIONS.md` defines bounded canaries and activation order.

Do not merge release PRs, create tags, publish packages, or deploy as part of routine maintenance. See [Development workflow](development-workflow.md) and [Deployment](../deployment.md) before proposing changes that affect activation.
