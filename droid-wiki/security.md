# Security

The repository separates event authorization, model execution and deterministic publication where implemented. These are specific barriers, not a general sandbox or a guarantee that every workflow has the same protections; compare [deployment](deployment.md) and [dependencies](reference/dependencies.md).

## Trust and authorization

`automations/COMMON.md` treats issue text, comments, PR content, logs, source-system material and other agents' output as untrusted evidence. Commands found there are not authorization. Fork PRs must not receive credentials or run on the Mac mini.

| Entry point | Implemented boundary |
|---|---|
| `.github/workflows/factory-review.yml` | Opt-in; same-repository, nondraft PR; live open/head/base-ref check; original actor and rerunner require write/admin unless exactly `factory-droid[bot]`; completed review deduplication |
| `.github/workflows/factory-mentions.yml` | Opt-in; human comment/review author matches actor, accepted association and write/admin permission for actor and rerunner; rechecks open same-repository PR after queuing |
| `.github/workflows/factory-ci-steward.yml` | Opt-in; failed/timed-out PR CI on the same repository; original/run/current/rerun actors checked; only `factory-droid[bot]` is exempt from human permission lookup |
| `.github/workflows/factory-triage.yml` | Opt-in for newly opened issues, not a writer-only author gate; read-only classification and separate validated comment publication |

Triage enabled in a public repository lets public issue authors initiate paid runs. `docs/OPERATIONS.md` therefore calls for one bounded private pilot first. A 100-item candidate search cannot prove there are no older duplicates.

Review is advisory: `.github/workflows/factory-review.yml` sets critical/high security blocking to `false`. CI Steward retains broad repair-job permissions, including Actions, contents, PR and issue write; its allowlisted workflow, authorization, optional-config rejection and bounded upstream invocation constrain use, but prose instructions are not token-scope restrictions. See [CI Steward](features/ci-steward.md).

## Triage's deterministic handoff

`.github/workflows/factory-triage.yml` gives the model read-only GitHub job permissions and only `Read,Glob,Grep,ApplyPatch`, with 30 turns and no shell or connector tools. `ApplyPatch` is available to write the local result. The instruction to write only `triage-result.json` is **not a filesystem sandbox**.

A deterministic step reconstructs the result using only allowed type/route enums and at most five known candidate numbers. Free text and extra fields are removed before uploading the one-day artifact. The separate issue-write job validates again, checks that the issue is still open and unchanged, deduplicates its bot comment and formats fixed text. It does not execute model output, modify labels/assignees, close issues or grant ready status. This narrows the publication channel; it does not establish general filesystem isolation. Details are in [issue triage](features/issue-triage.md) and [data models](reference/data-models.md).

## Wiki's write boundary

`.github/workflows/droid-wiki-refresh.yml` gives the generator contents-read GitHub permissions. It reads repository content and restored pages from the rolling branch, installs the official CLI and runs `/wiki` at high autonomy. Read-only refers to GitHub permissions, not an inability to write local files or a disconnected execution environment.

The deterministic publisher alone receives contents/PR write permissions and the optional dedicated wiki token. The artifact includes hidden metadata but excludes images/video; its retention is one day. The publish action stages only wiki paths and does not run the generator. These controls separate generation from Git writes, but do not validate every sentence or prevent generated wiki content from needing human review. See [wiki refresh](features/wiki-refresh.md).

## Credentials and identities

`docs/CREDENTIALS.md` stores credential metadata only. Never put values in prompts, arguments, logs, artifacts or this public repository. Check existing organization/repository credentials before creating replacements; issuance, rotation or scope changes require Jason's approval.

- Hosted action/Base Action/wiki execution uses `FACTORY_API_KEY` and the hosted runtime's GitHub identity. Presence does not prove quota or successful execution.
- Local prompts use the Mac mini's personal `gh` login and loopback `custom:droidproxy:gpt-6.1-sol`. Hosted runners do not inherit that login, connector access or reachable DroidProxy endpoint.
- Modern review/mentions/Steward checkouts disable persisted credentials. Mentions and Steward configure Git through `gh auth setup-git` so the upstream action's GitHub App token can support changes that trigger CI, without passing release credentials.
- The wiki generator does not receive `FACTORY_WIKI_PR_TOKEN`; the triage model does not receive an issue-write token.
- `RELEASE_PLEASE_TOKEN`, package publishing and production credentials are not supplied to Health, Readiness, Triage or Steward.

These are repository-level wiring and policy claims, not a review of all internals of upstream actions or an independent audit of current installations.

## Public/private and human ownership

`automations/COMMON.md` requires checking repository visibility before posting. Public output may contain a stable source ID, a link and a short summary, but not private issue text, private app names, Sentry events, licensed source content, traces, logs or recordings. Local run records are gitignored, but still must not contain secrets or raw private evidence. Never upload `.factory` folders.

`config/jhd.json` assigns source ownership to GitHub, Linear and Sentry. Automation writes only bot-owned links, execution status and its own comments; it must not overwrite human scope, priority, assignee, status or decisions. Conflicts or cancellations pause the GitHub item and stop work. Source writeback requires separately verified mappings and connectors.

`automations/COMMON.md` prohibits release merges, tags, package publication, store uploads and production deployments; it also prohibits weakening tests/checks, editing workflow/secret/publishing settings to pass, force pushes and overwriting another writer's work. Those prompt rules complement, but do not replace, infrastructure approval gates. The recorded package approval canary in `docs/PROVENANCE.md` proves only the gate, not publishing or every production path.

## Retired reviewer

Commit `d8596c0` removed this repository's legacy reusable reviewer on October 23, 2026. Its wildcard bot allowance and mutable action reference are no longer part of the checked-in workflow set. `.github/workflows/factory-review.yml` remains the opt-in automatic reviewer; its guards and limitations are described above.

This source change does not prove that other repositories completed their cutover or that a hosted review ran. `docs/OPERATIONS.md` still requires controlled replacement of other legacy responders. `scripts/validate.py` checks selected JSON policy, not workflow permissions, pins or bot lists; wrapper review and `tests/test_workflow_authorization.cjs` remain separate safeguards.
