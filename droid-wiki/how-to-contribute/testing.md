# Testing

The tests check JSON policy, the canonical-checkout command, and embedded workflow authorization and publication logic. They do not call a model or prove external installation. The CI entry point is `.github/workflows/validate.yml`.

## Run the checks

```sh
python3 scripts/validate.py
python3 -m unittest discover -s tests -v
node --test tests/*.cjs
```

These commands need Python 3, Node.js, Git, and `gh`, but no real credentials. The optional Ruff and ty commands in `README.md` are not run by `.github/workflows/validate.yml`. There is no dependency lockfile or pinned local linter configuration.

## Python tests

| File | Technique | What it proves |
| --- | --- | --- |
| `tests/test_validate.py` | Load a fresh JSON config per test, mutate fields, call `validate(config)` | Unsafe release switches, schedules, triage behavior, Steward bounds, bot wildcard, merge fields, source identity, and paths are rejected where explicitly checked. |
| `tests/test_control_checkout.py` | Create a temporary bare origin and working clones; execute the command extracted from `automations/COMMON.md` | Clean main fast-forwards; dirty, staged, untracked, detached, non-main, and ahead-of-origin checkouts are rejected without changing their checkout state. |

The checkout fixtures use HEAD and its parent, so a one-commit shallow checkout is insufficient. They push only to their temporary local bare repository. They do not modify the real origin.

## Node tests

`tests/test_workflow_authorization.cjs` extracts JavaScript from the mentions, review, and Steward YAML files. It supplies fake GitHub REST responses and evaluates a compatible subset of workflow expressions in a VM. Cases cover original actors and rerunners, PR eligibility, successful-review identity, lifecycle concurrency, queued mention checks, optional Steward configuration, and fixed action/token plumbing.

The credential-helper cases create isolated HOME and Git/GitHub configuration directories, run the literal `gh auth setup-git` command, and use randomly generated fake token canaries. They verify that credentials come from the action's environment and are not saved into configuration. They do not validate a real App installation or token scope.

`tests/test_triage.cjs` extracts the context, sanitizer, and publication scripts from `.github/workflows/factory-triage.yml`. It tests literal untrusted input handling, bounded candidates, fixed result categories, stripping free text, stale-issue suppression, own-bot marker deduplication, and rejection of invalid output before a write.

The VM harness is an offline logic test, not GitHub's actual expression engine, a YAML schema validator, or a filesystem sandbox. Its regular expressions also couple extraction to indentation and script-block layout.

## Add a regression

For policy changes, mutate one valid field into a bad value and assert the specific error. For workflow changes, extend the fake API responses or event context in the existing Node harness rather than duplicating the production script. For checkout rules, exercise the literal prompt command against a real temporary Git state.

During this wiki run, the validator accepted 13 entries, all **24 Python tests passed**, and all **101 Node tests passed**. Optional `uv`/Ruff/ty checks were not run because those commands were unavailable on PATH. Hosted canaries and product QA were not run.

See [Policy validation](../tooling/policy-validation.md), [Debugging](debugging.md), and [Deployment](../deployment.md) for the remaining verification boundaries.
