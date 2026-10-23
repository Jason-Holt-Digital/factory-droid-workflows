# Data models

This repository has JSON policy, transient workflow artifacts and Markdown evidence, not a database or public API schema. The contracts below connect [configuration](configuration.md), [triage](../features/issue-triage.md) and [recurring automations](../features/recurring-automations.md).

## Policy records and states

`config/jhd.json` has organization/trust/release controls, automation policy, CI budgets, queue labels, source ownership/enrollment, merge exclusions and repository records. Repository records carry `name`, relative `path`, `kind`, `release`, `state`, `automerge`, `native_qa_required`, and `deployment_audited`; the tag-pubdev entry adds publisher-gate fields.

`README.md` defines:

| State | Meaning |
|---|---|
| `prepared` | Files/prompts exist; nothing installed or switched on by that claim |
| `configured` | Installed or enabled, but no real run has proved the required outcome |
| `verified` | A real run produced the specified observable outcome |
| `deferred` | Separate work-policy/source status; not an allowed repository rollout state |

`scripts/validate.py` permits only the first three for repository `state`. Worker/Intake policy and PostHog use `deferred` separately. A successful no-op is not verification; `NOT_RUN: <reason>` records an unperformed check. `automations/COMMON.md` also distinguishes merged, released and verified. Independent flags can be true while the overall repository/source remains prepared.

## Stable IDs and ownership

`automations/COMMON.md` defines `linear:<issue UUID>` and `sentry:<numeric issue ID>`. Linear's human identifier, such as `ABC-123`, is display text, not stable identity.

`config/jhd.json` source mappings reference configured repository **names**, not local paths. Linear enrollment carries workspace identity and team mappings; Sentry enrollment carries organization, native-integration/writeback flags and project mappings with `project_id`, `project_slug`, `repository`, `mapping_verified`. Current mapping values are in [configuration](configuration.md).

| System | Owned fields in `config/jhd.json` |
|---|---|
| GitHub | `execution_status`, `pull_requests`, `verification` |
| Linear | `product_scope`, `acceptance_criteria`, `priority` |
| Sentry | `error_evidence`, `affected_releases`, `release_resolution` |

Automation writes bot-owned links, execution status and its own comments only. Human priority, scope, assignee, status and decisions are preserved. `automations/COMMON.md` requires pausing the GitHub item and stopping when a source cancellation/change conflicts with work. Closing a GitHub issue does not authorize resolving its Sentry source.

## Queue labels

`config/jhd.json` maps logical names to literal labels:

| Logical key | Label |
|---|---|
| `ready` | `automation:ready` |
| `working` | `automation:working` |
| `blocked` | `automation:blocked` |
| `awaiting_release` | `automation:awaiting-release` |
| `canary` | `automation:canary` |
| `paused` | `automation:paused` |

These are vocabulary, not an active worker state machine. Ticket-to-PR is deferred, and triage never applies a ready label.

## Triage context and result

`.github/workflows/factory-triage.yml` builds an ephemeral `triage-context.json` in the runner workspace:

```json
{
  "issue": {"number": 42, "title": "Example", "body": "Issue body"},
  "comments": [{"author": "example-user", "body": "Comment body"}],
  "recent": [
    {"number": 40, "title": "Related item", "body": "Bounded excerpt",
     "state": "open", "pull_request": false}
  ]
}
```

The current issue and all paginated comments are included. `recent` comes from at most 100 most recently updated same-repository issues/PRs in all states, excluding the current issue; each candidate body is sliced to 500 characters when present. It is the candidate list, not all context, that is bounded to 100. `candidate_numbers`, `issue_updated_at` and `eligible` are separate job outputs used by the deterministic handoff.

The model writes `triage-result.json`:

```json
{"type":"bug","route":"human-review","duplicates":[40]}
```

| Field | Allowed values |
|---|---|
| `type` | `bug`, `feature`, `question`, `maintenance` |
| `route` | `needs-info`, `human-review`, `documentation`, `security` |
| `duplicates` | Array of at most five safe-integer issue/PR numbers from the supplied candidates |

The prompt asks for positive candidate numbers and no extra fields. The sanitizer checks enums, array length and safe-integer membership, then reconstructs exactly those three keys and deduplicates numbers. Extra free text is removed, not published. Only the sanitized result is uploaded as artifact `issue-triage`, with one-day retention; the context is not the artifact.

The publish job rejects extra keys, revalidates membership and checks the issue's `updated_at` against the captured value. It removes self references, verifies candidate issues still exist and posts fixed text. Both jobs recognize an existing comment only when its author is `github-actions[bot]`, user type is `Bot`, and its body starts with `<!-- jhd-factory-triage -->`. Route recommendations confer no implementation authority. See [security](../security.md) for the filesystem/tool-limit distinction.

## Run evidence

`automations/COMMON.md` requires a Markdown record at the canonical runtime's `local-evidence/runs/<automation>/<UTC timestamp>.md`. It must state:

- What was checked and changed, with links.
- Each failure, failing command and relevant error line, without secrets.
- Every skipped check as `NOT_RUN: <reason>`.

This is a narrative contract, not a parsed schema. `automations/health.md` uses records and `automation/health-<UTC ISO year>-W<week>` PR branches to enforce its weekly organization-wide budget. `automations/readiness.md` adds stored report ID/date, level, percentage and passed/failed/skipped counts; a readiness score is not runtime QA.

`automations/digest.md` updates one private `JHD automation status` issue while preserving human sections. It reports observed states, newest readiness results, failures, paused/missed runs and human decisions. Missing commands/credentials are configuration failures, not successful skips. Run records are gitignored, but may not contain secret values or raw private evidence.

## Wiki metadata and artifact

The `/wiki` generator contract uses hidden `droid-wiki/.wiki-meta.json`, not a documentation page:

| Field | Contract |
|---|---|
| `generatedAt` | Generation timestamp |
| `commitHash` | Full source commit used to generate the wiki |
| `branch` | Source branch |
| `pageCount` | Number of generated Markdown pages |
| `topLevelSections` | Ordered section identifiers |
| `pageOrder` | Every Markdown path relative to the wiki root, in sidebar order |

Each page starts with H1 for title extraction; each directory has an index. `pageOrder` is explicit navigation, not alphabetical inference. Metadata fields are the generator convention, not a schema enforced by a repository script.

`.github/workflows/droid-wiki-refresh.yml` depends on preserving this hidden metadata for incremental generation: it checks out full history and restores only `droid-wiki/` from `factory/droid-wiki`. Artifact `droid-wiki` includes hidden files, excludes `droid-wiki/video/**` and `droid-wiki/images/**`, errors if absent, and has one-day retention. The publisher stages the corresponding wiki paths onto the rolling branch and targets the default branch. It does not inspect metadata field validity, so an actual PR and subsequent incremental update must be checked separately; see [wiki refresh](../features/wiki-refresh.md).
