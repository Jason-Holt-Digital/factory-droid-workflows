# JHD health

Read and follow `{{CONTROL_ROOT}}/automations/COMMON.md` first. Automation name for run records: `health`.

Goal: open at most ONE small, justified maintenance PR this week.

Before starting, read this ISO week's Health run records and check open and closed PRs from `automation/health-` branches across the configured repositories. If Health already opened a PR this week, stop, even if that PR was closed or merged. Use a branch named `automation/health-<UTC ISO year>-W<week>` so later runs can find it.

1. Let `w` be the ISO week number. Choose the repository at index `w mod N` in config order, where `N` is the number of repositories.
2. Skip it if it has an open issue labeled `working` or an open maintenance PR from this automation. Record why.
3. Find one problem worth fixing, with evidence: a failing or flaky check, a deprecated API warning, a nonbreaking development-dependency update, a broken link, or a missing test for existing behavior. Use checks that fit the repository `kind`; do not add unrelated tooling.
4. Do not sweep the repository. Do not rewrite agent instructions, skills, or architecture.
5. Implement in your own worktree in `<repo>-worktrees`, run tests and QA that apply, get an independent review, and open one PR that states the evidence. Never merge it automatically.
6. If nothing is worth fixing, record that. Do not invent work.
