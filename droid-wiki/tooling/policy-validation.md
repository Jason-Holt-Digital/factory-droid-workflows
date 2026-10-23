# Policy validation

Active contributors: Jason

`scripts/validate.py` rejects unsafe declared automation policy before it is merged or installed. It validates `config/jhd.json`; it does not configure hosted workflows or perform a general security audit of YAML.

## Directory layout

```text
config/jhd.json
scripts/validate.py
tests/test_validate.py
.github/workflows/validate.yml
```

This subsystem has one validator source, one JSON input, and one directly associated Python test file, a 1:1 test-file-to-code-file ratio. Default-branch history records one human author for these paths. These counts are structural, not coverage measurements.

## Key abstractions

| Symbol | File | Role |
| --- | --- | --- |
| `ROOT` | `scripts/validate.py` | Locate the repository independently of the caller's current directory |
| `STATES`, `KINDS` | `scripts/validate.py` | Allowed repository rollout states and check categories |
| `validate(config)` | `scripts/validate.py` | Return a list of policy-error strings without changing configuration |
| `main()` | `scripts/validate.py` | Load JSON, print errors, exit 1 if any exist, otherwise print the repository count |
| `PolicyValidationTest` | `tests/test_validate.py` | Mutate valid policy to exercise rejection cases |

## Enforced rules

`validate(config)` in `scripts/validate.py` checks:

- Human production approval and false automatic release/tag/deployment flags.
- No literal wildcard entry in the configured trusted-bot list.
- Deferred, unscheduled Ticket-to-PR and source Intake.
- Exact approved Health, Digest, and Readiness cadences and bounded outcomes.
- Classification-only triage without automatic-ready labeling.
- Exact integer Steward bounds of one retry, two fix commits, and ten invocations; no AI or release workflow watching.
- Unique repository names and valid source-mapping destinations.
- Verified Linear workspace identity and verified Sentry native linking/writeback before their verified state is accepted.
- Allowed repository states and kinds; no absolute or parent-traversing repository paths.
- Exact boolean merge/audit fields, plus a boolean approval-canary field for tag-published packages.
- Verified repository state and deployment audit before automatic merge, with a proven human approval gate for tag-published packages.

The code uses `is False` for several fixed policy flags and exact `type(...)` checks for selected booleans and Steward integers. Do not assume every field receives equally strict type validation.

## Limits and integration

`scripts/validate.py` expects required keys to exist. Malformed JSON, missing keys, or incompatible structures can raise exceptions instead of returning a friendly error list. It is not a complete schema, does not inspect every source-state value, does not verify external credentials, and does not parse workflow permissions, pins, or bot lists.

For example, the trusted-bot check in `config/jhd.json` does not inspect the `allowed_bots` input or actor checks in `.github/workflows/factory-review.yml`. Hosted guard values are separate code and need their own review and tests.

`.github/workflows/validate.yml` runs the validator followed by Python and Node suites. `tests/test_validate.py` imports `validate` directly, so policy logic should remain usable without command-line side effects.

## Modification entry points

Add new policy checks in `validate(config)` and add rejection tests in `tests/test_validate.py`. Change the JSON only with an approved policy decision, and update corresponding hosted guards if they repeat that constraint. Avoid describing a local pass as proof that a remote installation works.

## Key source files

| File | Purpose |
| --- | --- |
| `scripts/validate.py` | All validator rules and command-line behavior |
| `config/jhd.json` | Current declared policy and repository catalog |
| `tests/test_validate.py` | Regression tests for accepted and rejected policy |
| `.github/workflows/validate.yml` | CI invocation |

See [Configuration](../reference/configuration.md) for the fields and [Testing](../how-to-contribute/testing.md) for the broader harness.
