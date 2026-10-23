# Tooling

Active contributors: Jason

The repository's tooling is its product: workflow wrappers, task prompts, and policy checks rather than a compiled application. `README.md` and `.github/workflows/validate.yml` define the local and CI check entry points.

## Tool map

| Tool | Role | Source |
| --- | --- | --- |
| Python standard library | Load and validate JSON; run policy and temporary-Git tests | `scripts/validate.py`, `tests/test_validate.py`, `tests/test_control_checkout.py` |
| Node built-ins | Run extracted workflow JavaScript and isolated credential-helper tests | `tests/test_triage.cjs`, `tests/test_workflow_authorization.cjs` |
| Git and GitHub CLI | Canonical checkout checks, test fixtures, and environment-backed credentials | `automations/COMMON.md`, `.github/workflows/factory-mentions.yml`, `.github/workflows/factory-ci-steward.yml` |
| GitHub Actions | Host event wrappers and deterministic publisher jobs | `.github/workflows/validate.yml`, [feature workflows](../features/index.md) |
| Factory Droid | Upstream model execution, local recurring sessions, wiki generation | `docs/OPERATIONS.md`, `.github/workflows/droid-wiki-refresh.yml` |
| Optional uv, Ruff, ty | Convenience execution and Python lint/type checks | `README.md` |

There is no package manager manifest, application build system, code generator, or custom lint plugin. Two Python test files and two CommonJS test files support one standalone Python validator and the workflow wrappers; these are shared infrastructure, not separate packages.

## Modification entry points

Start with [Policy validation](policy-validation.md) for the JSON safety rules or [Testing](../how-to-contribute/testing.md) for the offline harnesses. Changes to an upstream action pin should follow `docs/PROVENANCE.md` and inspect the corresponding source workflow, rather than changing a version comment alone.

## Key source files

| File | Purpose |
| --- | --- |
| `README.md` | Local validator, test, lint, and type-check commands |
| `.github/workflows/validate.yml` | Deterministic CI check sequence |
| `scripts/validate.py` | Policy linter entry point |
| `docs/PROVENANCE.md` | Action versions and verification evidence |

The dependency inventory and pinning exceptions are in [Dependencies](../reference/dependencies.md).
