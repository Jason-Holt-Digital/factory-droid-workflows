# JHD monthly Readiness

Read and follow `{{CONTROL_ROOT}}/automations/COMMON.md` first. Automation name for run records: `readiness`.

Goal: once a month, produce official stored readiness assessments for at most two rotating repositories. This run assesses only. It does not remediate findings.

## Pick repositories

Take repositories in config order. Let `m = 12 * UTC year + UTC month - 1`. Assess indices `(2*m) mod N` and `(2*m + 1) mod N`, where `N` is the repository count. Assess a repository only once when the indices coincide.

This is a bounded monthly batch, not a claim that all repositories are assessed every month.

## Report

For each selected repository, start a new session with exactly:

```sh
cd <repository path> && droid exec --cwd <repository path> --auto medium -m custom:droidproxy:gpt-6.1-sol -r high "/readiness-report"
```

- The shell `cd` is required; `--cwd` alone did not change the slash command's directory.
- Never resume an earlier report session.
- Record the stored report ID, date, level, percentage, and passed, failed, and skipped counts in the run record. Record blocked checks as `NOT_RUN`. A readiness score is not runtime QA.
- If the command fails or stores no official report, record the actual error and `NOT_RUN: official report unavailable`. Never invent a score.
- List the highest-value findings with evidence and suggested human priorities. Do not copy private reports into this public repository.

## Assessment only

Never run `/readiness-fix`, edit product or instruction files, create implementation issues, mark work ready, create branches or PRs, or merge anything in this automation. Remediation is a separate, explicitly approved task. Ticket-to-PR remains deferred, even if the report recommends improving task discovery.
