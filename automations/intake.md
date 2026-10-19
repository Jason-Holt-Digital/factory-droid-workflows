# JHD intake

Read and follow `{{CONTROL_ROOT}}/automations/COMMON.md` first. Automation name for run records: `intake`.

Goal, every hour: keep source items and their GitHub execution work in step, and turn new verified source items into GitHub issues without duplicates.

## Sources

1. Read `sources` in the config. Use a source only when its `state` is `verified` and its verification flag (`workspace_verified` for Linear, `writeback_verified` for Sentry) is true. Record every other source as `NOT_RUN: source not verified`.
2. Linear: before any read or write, confirm the connector is in the JHD workspace and the team is mapped to a repository in the config. If the connector shows only the Artwod workspace, stop Linear work and record a configuration failure.
3. Sentry: use only JHD projects mapped to a repository. Use Sentry's native GitHub integration for linked issues and comment sync. Do not use a Sentry tool that the connector does not provide.
4. Skip items with no verified mapping and list their source IDs in the run record.
5. Do not scan PostHog.

## Part 1: reconcile linked work

Run this every hour, even when no source item changed.

1. Find every open GitHub issue with a `Source:` line, and every issue closed since the last intake run.
2. Work out each issue's stage from GitHub:
   - `open`: no PR yet
   - `in review`: a linked PR is open
   - `blocked`: labeled `blocked` or `paused`
   - `merged`: the linked PR is merged
   - `released`: the merge commit is in a published release. Check with `gh release list` and `git tag --contains <merge commit>` in the repository. Do not assume a release from a merge.
3. Update labels:
   - After `merged` or `blocked`, remove `working`.
   - After `merged`, add `awaiting_release` when the repository's `release` is not `none` and the stage is not `released`. Remove `awaiting_release` once `released`.
4. Update the source only when the stage changed since the last update:
   - Linear: edit one bot-owned progress comment (create it the first time) with the stage and the issue and PR links. Do not post a new comment for each update.
   - Sentry: write a bot-owned GitHub progress comment containing the new stage and PR or release links, and verify that the native integration syncs it back. Do not post the same stage twice. Do not resolve the Sentry issue. Resolution happens only through Sentry's release-aware resolution after the fix is in a release.
5. If the source item was cancelled or closed by a person, apply the cancellation rule in COMMON.md. Never reopen it.

## Part 2: new and changed source items

1. Read the whole item. For Linear: description, every comment and reply, attachments, and screenshots. For Sentry: the issue, the latest event, affected releases, and existing external issue links.
2. Build its source ID as defined in COMMON.md.
3. Look for existing execution work, and stop at the first match:
   - Sentry: the issue's existing native GitHub links.
   - Links already stored on the source item.
   - GitHub issues in the mapped repository with that ID, including closed ones: `gh issue list --repo <org>/<repo> --state all --search "\"Source: <source ID>\" in:body"`.
4. If an issue exists:
   - Add a comment to it with the new evidence summary and link. Never file a second issue.
   - Recurrence or new evidence means re-triage: remove `ready` and state what changed. If the GitHub issue was closed as completed, reopen it without `ready`. If it was closed as not planned, or a person cancelled the source item, leave it closed and add `paused`.
   - If a person changed scope or priority while the issue is labeled `working`, apply the conflict rule in COMMON.md.
5. If no issue exists, create one:
   - Sentry: create or link it through the native Sentry GitHub integration where available, so the link is native.
   - Otherwise create it with `gh issue create`.
   - The body starts with `Source: <source ID>`, then the source link, the acceptance criteria, and an evidence summary. The public-repository rule in COMMON.md applies.
   - Add `ready` only when scope is clear and the work fits the low-risk categories. When an item is ambiguous, high risk, or needs a product decision, add no queue label and comment with the question.
6. For Linear, add the GitHub issue link to the source item. Do not change any other source field.

## Feedback loop guard

Ignore source updates whose only change is a link or comment written by this automation, the worker, or the native integration.
