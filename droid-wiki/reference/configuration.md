# Configuration

`config/jhd.json` declares organization policy and 13 repository records. Local prompts read it at run time; hosted workflows use independent YAML guards and inputs, so changing JSON alone does not reconfigure those workflows.

## Policy and execution

| Key or group | Declared value |
|---|---|
| `organization` | `Jason-Holt-Digital` |
| `execution_queue` | `github` |
| `status_repository` | `Jason-Holt-Digital/jhd-skills` |
| `local_model` | `custom:droidproxy:gpt-6.1-sol` |
| `assessment_effort` / `remediation_effort` | `high` / `xhigh` |
| `trusted_associations` | `OWNER`, `MEMBER`, `COLLABORATOR` |
| `trusted_bots` | Exactly `factory-droid[bot]` |
| `production_approval` | `human` |
| `automatic_release_merges`, `automatic_tag_creation`, `automatic_production_deployments` | All `false` |

`automations/COMMON.md` requires using JSON policy when it disagrees with the common prompt and reporting the disagreement. That local precedence rule does not make the YAML import JSON. For example, `.github/workflows/factory-mentions.yml` hardcodes its association list and permission checks; `.github/workflows/factory-ci-steward.yml` hardcodes budgets and rejects an existing default-branch `.github/droid-ci.yml` pending audit.

## Cadences and budgets

`config/jhd.json` declares:

| Policy | Schedule or trigger | Bound |
|---|---|---|
| `automation_policy.ticket_to_pr` | `state: deferred`, `schedule: null` | No implementation |
| `automation_policy.source_intake` | `state: deferred`, `schedule: null` | No recurring source polling |
| `automation_policy.health` | `0 3 * * 3` UTC | One PR per ISO week across the organization |
| `automation_policy.digest` | `30 7 * * 1` UTC | Seven-day lookback |
| `automation_policy.readiness` | `0 3 1 * *` UTC | At most two repositories; `remediation: false` |
| `automation_policy.triage` | `issues.opened` | `implementation: false`, `automatic_ready: false` |
| `ci_steward` | Allowlisted deterministic CI failures | One retry, two fix commits, ten invocations per PR; AI/release watchers `false` |

Schedules are installed native-automation state, not GitHub cron triggers. The retained deferred registrations have a parking cron solely because registrations require one; they stay paused and their prompts do nothing. Rotation and runtime details are in [recurring automations](../features/recurring-automations.md).

## Repository catalog

All rows below are from `config/jhd.json`: all have `state: prepared`, `automerge: false`, and `deployment_audited: false`. These are declared records, not proof of installation, runtime QA or deployment audits.

| Repository | Configured path | Kind | Release model | Native QA required |
|---|---|---|---|---|
| MythicGME2e | `MythicGME2e` | flutter | notes-and-store | Yes |
| mythic_gme_apps | `mythic_gme_apps` | flutter-workspace | independent-components | Yes |
| tome_keeper | `tome_keeper` | flutter | existing-release-please | Yes |
| mythic-dice-parser | `mythic-dice-parser` | dart-library | package | No |
| icloud_storage_plus | `icloud_storage_plus` | flutter-plugin | tag-pubdev | Yes |
| jhd-jaspr | `websites/jhd-jaspr` | dart-web | notes-and-site | No |
| jhd-astro | `websites/jhd-astro` | typescript-web | site | No |
| ac-deck-builder | `ac-deck-builder` | flutter | none | Yes |
| broken-empires-creator | `broken-empires-creator` | typescript-web | site | No |
| jhd-skills | `jhd-skills` | skills | none | No |
| agent-skills | `agent-skills` | skills | none | No |
| Mythic-Source-Materials | `Mythic-Source-Materials` | sources | none | No |
| factory-droid-workflows | `factory-droid-workflows` | automation | none | No |

There are nine distinct kinds and eight distinct release strings in this catalog. They select/check policy categories, not package dependencies or universal build commands. `icloud_storage_plus` also declares `publish_environment: pub.dev`, `human_gate_configured: true`, and `human_gate_canary_verified: true`; those gate facts do not upgrade its repository rollout state or prove publication.

Paths are relative values. `scripts/validate.py` rejects absolute paths and `..` components and describes the restriction as staying under the “repo root,” but does not resolve/check clones. **Actual local runtime resolution in `automations/COMMON.md` is relative to the parent of `CONTROL_ROOT`.** Thus the control repository's own path names a sibling-level location, and the website paths resolve under that parent's `websites/`. `docs/OPERATIONS.md` further identifies the deck app's working subdirectory as `prototypes/ac_deck_prototype`; the catalog path remains the repository root.

## Sources and ownership

`config/jhd.json` declares GitHub ownership of `execution_status`, `pull_requests`, `verification`; Linear ownership of `product_scope`, `acceptance_criteria`, `priority`; and Sentry ownership of `error_evidence`, `affected_releases`, `release_resolution`.

| Source | Declared enrollment |
|---|---|
| Linear | `prepared`; `workspace_verified: false`; `workspace_id: null`; empty `team_mappings` |
| Sentry | `prepared`; organization `jason-holt-digital-llc`; `writeback_verified: false`; `native_integration_verified: false` |
| Sentry project mapping | ID `4508302395899904`, slug `mythic-gme-mobile`, repository `MythicGME2e`, `mapping_verified: true` |
| PostHog | `deferred`; `minimum_product_version: "1.7"` |

A verified project mapping is not verified Sentry feedback. `docs/CREDENTIALS.md` records the Linear workspace mismatch and Sentry feedback gaps; these historical notes do not authorize live source writes. Labels and stable source IDs are specified in [data models](data-models.md).

## Merge exclusions

`config/jhd.json` declares these patterns:

```text
.github/**
**/AGENTS.md
**/CLAUDE.md
**/.factory/settings.json
**/release-please-config.json
**/.release-please-manifest.json
**/pubspec.yaml
**/codemagic.yaml
**/migrations/**
**/secrets/**
```

This is policy data, not a repository branch-protection implementation. No active ticket worker enforces an automatic merge pipeline here; all catalog `automerge` flags are false.

## Hosted and external settings

`.github/workflows/factory-review.yml`, `.github/workflows/factory-mentions.yml`, `.github/workflows/factory-triage.yml` and `.github/workflows/factory-ci-steward.yml` check the `JHD_FACTORY_*_ENABLED` variables listed in [deployment](../deployment.md). Their literal strings, triggers, permissions, timeouts and upstream inputs are YAML configuration separate from JSON.

`.github/workflows/droid-wiki-refresh.yml` hardcodes the `main` push trigger, `factory/droid-wiki` rolling branch, concurrency, artifact exclusions and optional wiki-token fallback. It has no enable variable. Secrets, Actions PR-creation permission, App installations, external approval environments, canonical clone path and native registration status/cadence live outside this JSON.

`scripts/validate.py` checks selected invariants, not a complete JSON schema, arbitrary release strings, installed schedules, credential state or YAML consistency. Missing structure may raise an exception rather than a structured schema error. See [policy validation](../tooling/policy-validation.md) before changing either policy surface.
