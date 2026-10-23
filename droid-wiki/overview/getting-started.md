# Getting started

You can validate this repository without Factory credentials or access to any managed application repository. `README.md` lists the checks, and `.github/workflows/validate.yml` runs the dependency-free validator and test suites in CI.

## Prerequisites

Install Git, Python 3, Node.js with the built-in `node:test` runner, and GitHub CLI (`gh`). The Node authorization tests exercise `gh auth setup-git` with isolated fake credentials; a real GitHub login is not needed for those tests. `tests/test_control_checkout.py` uses temporary Git clones and needs repository history including HEAD's parent.

There is no package manifest, dependency-install step, application build, or development server. Optional `uv`, Ruff, and ty commands are documented in `README.md`; their versions are not pinned in this repository.

## Clone and check

```sh
git clone https://github.com/Jason-Holt-Digital/factory-droid-workflows.git
cd factory-droid-workflows
python3 scripts/validate.py
python3 -m unittest discover -s tests -v
node --test tests/*.cjs
```

These commands match the checks in `.github/workflows/validate.yml`. If using a shallow checkout, fetch enough history for the temporary-Git tests. The full-history checkout used by `.github/workflows/droid-wiki-refresh.yml` is also required for reliable wiki history and incremental diffs.

With the optional tools installed, `README.md` also documents:

```sh
uv run python scripts/validate.py
uv run python -m unittest discover -s tests -v
uvx ruff check scripts tests
uvx ty check scripts tests
```

## Inspect before activating

Start with `config/jhd.json`, then read `docs/OPERATIONS.md`, `docs/CREDENTIALS.md`, and `docs/PROVENANCE.md`. Do not execute the task prompts just to understand them. Tests do not activate schedules, perform hosted model calls, or prove an installed workflow's external result.

The canonical local automation checkout has stricter requirements than a development clone: it must be clean, on main, fast-forwarded, and equal to origin/main before a run, as specified in `automations/COMMON.md`.

For next steps, see [Testing](../how-to-contribute/testing.md), [Development workflow](../how-to-contribute/development-workflow.md), and [Deployment](../deployment.md).
