# Development workflow

Develop in a normal branch or worktree, validate the change locally, and review its authority and activation effects before merging. This is separate from the clean canonical main checkout required for scheduled automation runs in `automations/COMMON.md`.

## Edit and validate

1. Read the policy and the specific implementation. A JSON-only edit in `config/jhd.json` does not change the guards in `.github/workflows/factory-review.yml`, `.github/workflows/factory-mentions.yml`, or `.github/workflows/factory-ci-steward.yml`.
2. Change the narrowest relevant source and regression test. Workflow JavaScript lives inside YAML, and Node tests extract those blocks directly.
3. Run the checks documented in `README.md`: the policy validator, Python unittest discovery, and Node tests. Run the optional Python lint/type checks when those tools are available.
4. Review the diff for private content, credential values, permission changes, release effects, and accidental workflow activation.
5. Propose the change with evidence and explicit `NOT_RUN` reasons. Local success does not establish hosted execution.

`automations/health.md` specifies an isolated worktree, applicable tests/QA, independent review, and a single justified maintenance PR for Health's own work. Do not generalize its weekly branch naming or one-PR budget into a universal repository contribution rule.

## Merge is an operational event

`.github/workflows/validate.yml` runs on PRs, main pushes, and manual dispatches. `.github/workflows/droid-wiki-refresh.yml` runs on main pushes without a JHD enable variable, so merging its setup is activation.

The other modern event wrappers depend on explicit enable variables. Keep diagnosis separate from repair for Steward, and do not disable a legacy responder until a replacement is proven. `docs/OPERATIONS.md` requires a controlled cutover to avoid duplicate responses.

No workflow here grants a routine task authority to merge release PRs or deploy production. The selected product repositories can have production effects on main pushes, so automatic merge remains disabled in `config/jhd.json`.

## Canonical checkout versus development checkout

Normal local automation runs require the literal setup command from `automations/COMMON.md`: reject dirty files, reject a non-main or detached checkout, fast-forward from origin/main, and require HEAD to equal origin/main. `tests/test_control_checkout.py` verifies those cases.

A feature worktree is not a substitute for the canonical runtime. Do not point installed prompts at unmerged setup files to bypass the prerequisite. Generated wiki pages also make a checkout dirty until appropriately reviewed and committed or kept in a separate working location.

`.gitignore` excludes local evidence, QA output, Python caches, and virtual environments. It does not make sensitive content safe to publish. See [Security](../security.md) and [Testing](testing.md).
