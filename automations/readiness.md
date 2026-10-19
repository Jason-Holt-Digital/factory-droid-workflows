# JHD readiness

Read and follow `{{CONTROL_ROOT}}/automations/COMMON.md` first. Automation name for run records: `readiness`.

Goal: run the official readiness report for at most two repositories this week, and fix only justified findings.

## Pick repositories

Take the configured repositories in config order. Let `w` be the ISO week number. Assess the repositories at index `(2*w) mod N` and `(2*w + 1) mod N`, where `N` is the number of repositories.

## Report

For each repository, start a new session with exactly:

```sh
cd <repository path> && droid exec --cwd <repository path> --auto medium -m custom:droidproxy:gpt-6.1-sol -r high "/readiness-report"
```

- The shell `cd` is required; `--cwd` alone did not change the slash command's directory.
- Never resume an earlier report session. A resumed session keeps its original autonomy level.
- Record the stored report ID, level, percentage, and passed, failed, and skipped counts in the run record. Record checks that were blocked as `NOT_RUN`. The score is not runtime QA.
- If the command is missing, fails, or stores no official report, record the actual error and `NOT_RUN: official report unavailable`. Never write your own score or present your own assessment as the Factory report.
- Do not copy the report into the public repository.

## Fix

Only when the report gives a concrete finding that improves real engineering safety:

1. Create your own worktree in `<repo>-worktrees` on a new branch.
2. `cd <worktree> && droid exec --cwd <worktree> --auto medium -m custom:droidproxy:gpt-6.1-sol -r xhigh "/readiness-fix"` as a new session.
3. Keep only targeted changes. Drop mass AGENTS.md rewrites, architecture changes, and tooling added only to raise a score. Record not-applicable checks with reasons instead.
4. Run tests, get an independent review, and open one PR per repository. Never merge it automatically.
