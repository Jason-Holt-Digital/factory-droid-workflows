# Dependencies

The repository has no npm or Python dependency manifest, application package graph or database dependency. Its executable dependencies are GitHub Actions, standard-library Python/Node tests, external CLIs and hosted/local services; [security](../security.md) explains their trust boundaries.

## Action inventory

Across the six files in `.github/workflows/`, there are **23 `uses:` references**, **six upstream action families**, and **seven distinct action paths** when `Factory-AI/droid-action/base-action` is counted separately from its parent. Of those references, 19 use exact commit SHAs and four use mutable tags. These counts describe this repository's YAML, not the declared 13-repository rollout or transitive actions inside upstream implementations.

| Family / path | Exact SHA used here | References |
|---|---|---|
| `Factory-AI/droid-action` | `ec767fcf5fac43b64e746cd42bb398b3b0b529ed` (v10 comment) | 3 pinned |
| `Factory-AI/droid-action/base-action` | `ec767fcf5fac43b64e746cd42bb398b3b0b529ed` (v10 comment) | 1 pinned; same upstream family |
| `actions/checkout` | `fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09` (v5 comment) | 5 pinned; 2 wiki `@v4` |
| `actions/github-script` | `ed597411d8f924073f98dfc5c65a23a2325f34cd` (v8 comments) | 7 pinned |
| `actions/upload-artifact` | `ea165f8d65b6e75b540449e92b4886f43607fa02` (v4 comment) | 1 pinned; 1 wiki `@v4` |
| `actions/download-artifact` | `d3f86a106a0bac45b974a628896c90dbdf5c8093` (v4 comment) | 1 pinned; 1 wiki `@v4` |
| `peter-evans/create-pull-request` | `5f6978faf089d4d20b00c7766989d076bb2fc7f1` (v8.1.1 comment) | 1 pinned |

`.github/workflows/factory-review.yml`, `.github/workflows/factory-mentions.yml`, `.github/workflows/factory-ci-steward.yml`, `.github/workflows/factory-triage.yml` and `.github/workflows/validate.yml` supply the modern SHA references. `docs/PROVENANCE.md` records provenance for the official v10 action and template choices.

`.github/workflows/droid-wiki-refresh.yml` intentionally retains the official installer template's checkout/upload/download `@v4` references. Its CLI is installed from `https://app.factory.ai/cli` at run time rather than a pinned CLI release. These are explicit mutable dependencies, not exact pins.

Commit `d8596c0` removed the legacy reusable reviewer and its two mutable action references on October 23, 2026. The remaining four mutable `uses:` references all belong to `.github/workflows/droid-wiki-refresh.yml`; removing the old reviewer did not pin those dependencies.

## Runtimes and commands

| Dependency | Usage and version contract |
|---|---|
| Python 3 | `scripts/validate.py` and `tests/test_validate.py`; standard library only |
| Node.js | `node --test tests/*.cjs`; standard-library test/VM/filesystem tooling, no npm install |
| Git | History, canonical checkout checks and temporary fixture repositories used by tests |
| GitHub CLI `gh` | Local repository/status operations and hosted `gh auth setup-git` in mentions/Steward |
| Factory Droid CLI | Wiki generation and local `/readiness-report`; local model smoke/report history in `docs/PROVENANCE.md` |
| `uv`, `uvx` | Optional launchers in `README.md`; not required for direct Python/Node checks |
| Ruff, ty | Optional `uvx ruff check scripts tests` and `uvx ty check scripts tests`; not run by validation CI |

`.github/workflows/validate.yml` uses `ubuntu-24.04`; other workflow jobs use `ubuntu-latest`. There is no setup-python/setup-node action or explicit Python/Node release constraint. Action version comments are not evidence of the runner's language-runtime versions. `README.md` does not pin uv, Ruff or ty versions either.

The validation workflow runs the policy validator, Python unittest discovery and Node tests directly. No dependency installation, application compilation or release artifact is defined for this control repository. Test fixtures use temporary Git repositories and simulated API responses; they do not require real service credentials. See [testing](../how-to-contribute/testing.md).

## Services and identities

`docs/CREDENTIALS.md` distinguishes hosted Factory execution using `FACTORY_API_KEY` and the Factory GitHub App from Mac mini execution using the local `gh` login and loopback DroidProxy. The local model is `custom:droidproxy:gpt-6.1-sol`; its endpoint/login is not available to hosted runners. Native local automations also depend on the Mac mini being online, the canonical clone and external registration state.

GitHub supplies repository events, Actions, artifacts, issues/PRs and the wiki publisher's `GITHUB_TOKEN` fallback. An optional dedicated `FACTORY_WIKI_PR_TOKEN` can make new wiki PRs trigger checks; fallback-created PRs need human close/reopen. Credential presence and App installation do not prove quota or workflow outcomes.

`config/jhd.json` declares Linear and Sentry source enrollment, with verification gaps; PostHog remains deferred until at least product version 1.7. `docs/CREDENTIALS.md` also records Slack as optional and not part of the core loop. These declarations do not make source polling or writeback active. Existing Cloudflare, Release Please and pub.dev integrations described in `docs/OPERATIONS.md` belong to downstream production/release ownership, not dependencies to install for these standard-library tests.

No current external credentials, private evidence or service state was queried to build this inventory. Historical verification records in `docs/PROVENANCE.md` are scoped observations, not live dependency health checks.
