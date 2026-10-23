# Patterns and conventions

Changes should preserve explicit trust checks, bounded work, and evidence-based status reporting. The conventions are visible in `AGENTS.md`, `automations/COMMON.md`, the hosted workflow wrappers, and the tests; there is no separate contribution guide or project-specific formatter configuration.

## Approved coding principles

`AGENTS.md`, added in `e5535c9` on October 23, 2026, records five approved principles:

- Validate unknown values once at the boundary that owns them, then pass typed values inward. Do not defensively revalidate values a schema, constructor, or internal type already guarantees.
- Do not extract single-use helpers preemptively. Inline the logic at the call site unless the helper is reused, hides a genuinely complex boundary, or has a clear independent name that improves the caller.
- Before adding complexity for a speculative race or security edge case, explain the concrete failure mode, its likelihood, and the complexity cost, and get buy-in first. Do not silently expand scope for theoretical robustness.
- Test the actual implementation; do not duplicate logic into tests. The extraction-based tests below are the existing application of this rule.
- Comment non-obvious constraints and surprising behavior, not obvious assignments or control flow.

## Fixed policy and typed checks

`scripts/validate.py` exposes `validate(config)`, which accumulates human-readable policy errors, and `main()`, which loads `config/jhd.json`, prints failures, and exits nonzero. It uses exact `bool` and `int` checks for selected merge gates and Steward budgets so Python's boolean/integer overlap does not bypass those constraints.

This is policy lint, not a complete JSON schema. Required-key and parse errors can raise exceptions. Other values are checked only where the validator explicitly handles them. Hosted YAML repeats critical constraints instead of importing the JSON; preserve both declarations when an approved policy changes.

## Authorize before execution

The review, mentions, and Steward wrappers start with explicit feature switches and a separate authorization job. They check current GitHub permission levels for relevant actors, including rerunners. `.github/workflows/factory-mentions.yml` permits only human PR commands; `.github/workflows/factory-review.yml` and `.github/workflows/factory-ci-steward.yml` also allow the named Factory bot.

The legacy reusable reviewer was removed in `d8596c0`. Use `.github/workflows/factory-review.yml` as the automatic-review entry point rather than restoring the older wildcard-bot workflow. `scripts/validate.py` does not inspect workflow YAML; keep the explicit workflow checks and their tests.

## Separate model output from write authority

`.github/workflows/factory-triage.yml` treats issue text as untrusted data, restricts the model's local tools, sanitizes its JSON, and gives only the deterministic publisher issue-write permission. `.github/workflows/droid-wiki-refresh.yml` similarly separates generation from a publisher that opens the rolling PR. Tool restrictions are not a filesystem sandbox, as `docs/OPERATIONS.md` notes.

Keep credentials out of saved Git checkout configuration. The mentions and Steward wrappers configure an environment-backed `gh` credential helper before the upstream action supplies its App token; `tests/test_workflow_authorization.cjs` verifies this with fake canaries.

## Test the actual wrapper code

`tests/test_triage.cjs` and `tests/test_workflow_authorization.cjs` extract embedded JavaScript from workflow files and execute it with fake GitHub APIs in Node VM contexts. They depend on YAML block formatting as well as semantics. An indentation change can break extraction without changing intended behavior.

`tests/test_validate.py` mutates valid configuration to prove unsafe variants fail. `tests/test_control_checkout.py` tests the literal setup command from `automations/COMMON.md` against temporary Git repositories rather than reimplementing it.

## Report observations, not assumptions

Use prepared/configured/verified accurately and give each skipped check a `NOT_RUN` reason. Keep private run records in the ignored location specified by `automations/COMMON.md`; never put raw private evidence, secrets, or recordings into this public repository. Merged, released, and verified are different observations.

See [Security](../security.md), [Policy validation](../tooling/policy-validation.md), and [Testing](testing.md) for the detailed boundaries.
