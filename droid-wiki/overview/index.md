# Factory workflows

This repository holds delivery-automation policy, GitHub Actions workflows, and local Factory prompt templates for Jason Holt Digital. It covers 13 repositories, but does not contain their application code. The scope and directory map are recorded in `README.md` and `config/jhd.json`.

## What it does

- [Code review](../features/code-review.md) runs advisory review and security checks on eligible PRs.
- [PR commands](../features/pr-commands.md) accept human `@droid` requests on open, same-repository PRs.
- [Issue triage](../features/issue-triage.md) classifies new issues without starting implementation.
- [CI Steward](../features/ci-steward.md) diagnoses selected deterministic CI failures with separately enabled bounded fixes.
- [Wiki refresh](../features/wiki-refresh.md) generates documentation on main pushes and publishes a rolling documentation PR.
- [Recurring automations](../features/recurring-automations.md) define weekly Health and Digest runs and monthly assessment-only Readiness runs.

These capabilities are declared in `docs/OPERATIONS.md`. The event implementations live in `.github/workflows/`; the recurring task instructions live in `automations/`. Ticket-to-PR and source Intake remain deferred no-op prompts in `automations/worker.md` and `automations/intake.md`.

## Read the states literally

`README.md` distinguishes **prepared** files from **configured** installations and **verified** observed outcomes. All repository entries in `config/jhd.json` are prepared with automatic merge disabled. Historical evidence and unresolved checks are in `docs/PROVENANCE.md`; this wiki does not independently verify external installations.

A green job that skipped work is not proof. Merging a PR is not releasing a product, and releasing is not verifying it. Production actions stay human-owned under `config/jhd.json`.

## Where to start

Read [Architecture](architecture.md) for the hosted/local split, [Getting started](getting-started.md) for local checks, and [Contributing](../how-to-contribute/index.md) before changing policy. Operators should read [Deployment](../deployment.md) before enabling anything. Exact keys and dependencies are under [Reference](../reference/index.md).
