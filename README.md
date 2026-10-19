# factory-droid-workflows

Policy, documentation, and prompt templates for Jason Holt Digital (JHD) software-delivery automation across 13 repositories. It also holds the reusable Droid review workflow.

This repository is public. It holds policy, credential names, and procedures only. Secret values, private issue text, licensed source content, logs, traces, and recordings stay out of it.

## Contents

| Path | Purpose |
|---|---|
| `config/jhd.json` | Single source of policy: repositories, trust lists, queue labels, source ownership, CI Steward limits, merge exclusions, and each repository's state. |
| `scripts/validate.py`, `tests/` | Policy lint. Fails when release automation, wildcard bots, or unproven automatic merges appear in the config. |
| `automations/` | Prompts for the native Factory scheduled automations: intake, worker, readiness, health, and digest. `COMMON.md` holds rules shared by all five. |
| `docs/OPERATIONS.md` | Install, pause, resume, canary, and recovery steps. |
| `docs/CREDENTIALS.md` | Credential metadata: name, purpose, scope, destination, expiry, and status. |
| `docs/PROVENANCE.md` | Pinned action versions, template corrections, and what has been verified. |
| `.github/workflows/factory-review.yml`, `factory-mentions.yml`, `factory-ci-steward.yml` | This repository's copies of the review, mention, and CI Steward workflows that each JHD repository receives. |
| `.github/workflows/validate.yml` | Runs the policy lint and tests as the `Automation configuration` workflow. |
| `.github/workflows/droid-review-reusable.yml` | Existing reusable review workflow. It stays in place until its replacement is proven. |
## States

Every automation and repository has one state:

- **prepared**: files or prompts exist, nothing is installed or switched on.
- **configured**: installed or switched on, but no real run has proven it.
- **verified**: a real run produced the observable result the spec requires. A green run that did nothing is not proof.

Checks that were not run are reported as `NOT_RUN` with a reason.

Live status is in the issue titled `JHD automation status` in the private `Jason-Holt-Digital/jhd-skills` repository.

## Validate

```sh
uv run python scripts/validate.py
uv run python -m unittest discover -s tests -v
node --test tests/test_workflow_authorization.cjs
uvx ruff check scripts tests
uvx ty check scripts tests
```

CI runs the validator, Python tests, and Node tests in `.github/workflows/validate.yml`.
