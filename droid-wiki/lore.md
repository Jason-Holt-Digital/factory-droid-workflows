# Lore

Eight default-branch commits tell a compact story: reusable review on **June 24, 2026**, an opened-only adjustment on **June 26**, and on **October 23** a broader native automation control repository, retirement of the original reusable workflow, and a recorded set of approved coding principles. See [by the numbers](by-the-numbers.md) for the measured growth.

## June 24, 2026: reusable review takes shape

The repository began with a two-line `/README.md` in `60ef6f8`. Less than a minute later, `8e504ca` added `/.github/workflows/droid-review-reusable.yml`: a callable workflow using `Factory-AI/droid-action@main`, automatic review, and configurable security-review and review-depth inputs.

Two same-day changes established its lasting shape:

- `dcccac2` added the direct `pull_request` trigger for required-workflow enforcement. The same diff removed both caller inputs and fixed `automatic_security_review: true`; it also removed the explicit `review_depth` setting. The history proves these interface changes, not a separate product deprecation announcement.
- `2abd45d` added `allowed_bots: "*"`, with a commit subject naming Dependabot and Release Please.

**Longest-standing capability:** automatic PR review with a security pass, introduced in `8e504ca` and still present through its modern replacement, `/.github/workflows/factory-review.yml`. The original caller-configurable security/depth interface was short-lived, and the callable implementation itself survived only until its dated October 23 retirement in `d8596c0`.

## June 26, 2026: review only when opened

`d75b61a` added `types: [opened]` to the legacy workflow's `pull_request` trigger. It was a one-line scope reduction, not a rewrite. `workflow_call` remained available.

That version left the repository at **two tracked files and 33 physical lines**. The default-branch history then contains no commits in July, August or September. Until its October retirement, the legacy workflow kept opened-only direct triggering, wildcard bot allowance, write permissions and an unpinned action reference; the newer wrappers' guarantees never applied to it. [Code review](features/code-review.md) records the dated removal.

## October 23, 2026: a native automation control repository

The squash commit `76c29f7` (`ci: add native Factory delivery automation (#1)`) added **22 files**, modified `/README.md`, and left the original reusable workflow unchanged. Its diff contains **2,382 insertions and one deletion**, growing the repository to **24 files and 2,414 physical lines**.

The new scope is visible in the source layout:

- `/.github/workflows/factory-review.yml` and `/.github/workflows/factory-mentions.yml` introduced dedicated review and command wrappers; `/.github/workflows/factory-ci-steward.yml` and `/.github/workflows/factory-triage.yml` added bounded CI and issue-classification flows.
- `/.github/workflows/droid-wiki-refresh.yml` added wiki generation and rolling-PR publication; `/.github/workflows/validate.yml` added deterministic repository checks.
- `/config/jhd.json` declared the policy and 13-repository catalog. `/scripts/validate.py` and `/tests/` made policy and workflow guard behavior locally testable.
- `/automations/` supplied local recurring prompts, while `/docs/OPERATIONS.md`, `/docs/CREDENTIALS.md` and `/docs/PROVENANCE.md` recorded operation, credential boundaries and evidence.

### Same-day retirement of the legacy reviewer

Later on October 23, `d8596c0` (`ci: remove legacy reusable Droid review workflow (#2)`) deleted the 31-line `/.github/workflows/droid-review-reusable.yml` and its README mention: **one insertion and 33 deletions**, shrinking the tree from 24 to 23 files. The squash message records the reason: the legacy Droid workflows ran `Factory-AI/droid-action@main`, unpinned, and the opt-in `factory-review` and `factory-mentions` wrappers replace them; keeping both would have produced two reviews per PR and two replies per mention once the replacements were enabled.

This is a dated retirement of the callable interface, not evidence that the replacement is enabled, canaried, or proven in hosted runs. Deletion of the old workflow and enablement of the modern wrappers are separate claims.

### Same-day coding principles

`e5535c9` (`docs: add approved coding principles`) closed October 23 by adding `/AGENTS.md`: eight lines recording five approved principles covering boundary validation, helper extraction, speculative complexity, testing real implementations, and comment scope. It changed no workflow, policy, or test behavior.

### Preparation dates are not merge dates

`/docs/PROVENANCE.md` explicitly dates its observations **2026-10-19 unless stated otherwise**. Those observations include preparation and external canaries; the default-branch commit containing the document is dated **October 23**. The squash message also preserves preparation commit subjects and repeated bot coauthor trailers. Neither the document date nor those embedded subjects creates additional `origin/main` commits.

The provenance records hosted execution of the new workflows and every native automation as unverified. File presence, a successful local check, an approval-gate canary and a working production deployment are different claims. This history documents preparation, not blanket rollout completion; see [deployment](deployment.md).

### Superseded direction, retired artifact

The modern review wrapper broadens triggering to updated PR heads and uses explicit trust checks and a pinned upstream action. `/docs/PROVENANCE.md` calls for `synchronize` and named trusted bots. The October 23 deletion turned that new policy direction into a full replacement: the old wildcard, opened-only callable workflow no longer exists at HEAD, and only historical prose should refer to its former path.

`/automations/worker.md` and `/automations/intake.md` are paused, deferred no-op prompts at this snapshot. `/docs/PROVENANCE.md` describes former registrations, but the eight-commit default-branch history does not establish when an earlier implementation was removed or whether one ever ran. Do not infer a removal date from their current state.

No wholesale rewrite is evidenced by this history. The June changes are small edits; the October changes are one additive expansion and one 31-line deletion, each with a README update. Growth is concentrated in one squash commit, so its size does not reveal how long preparation took or how much was tested live.

## Reading the evidence

Commit hashes above are the eight commits reachable from `origin/main`; other local refs are not counted as default-branch eras. Bot coauthor attribution in `76c29f7`, `d8596c0`, and `e5535c9` is evidence of assistance, not a generated-code percentage. Current sources establish live behavior; historical diffs establish the specific June interface changes and the dated October retirement. For the current execution model rather than its chronology, start with [architecture](overview/architecture.md).
