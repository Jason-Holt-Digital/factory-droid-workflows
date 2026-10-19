# Credentials

Metadata only. Values never appear in this repository, in prompts, in command arguments, in logs, or in uploaded artifacts. Existing credentials are reused; replacing or rotating one needs Jason's approval. Check for an existing credential, including organization-level secrets, before creating one, so no duplicate is made.

Each runtime uses the identity it actually runs as. A hosted runner or GitHub Actions job does not inherit the Mac mini's personal `gh`, Linear, Sentry, or DroidProxy login.

| Credential | Purpose | Scope | Destination | Expiry | Status |
|---|---|---|---|---|---|
| `FACTORY_API_KEY` | Official Droid action, classification Base Action, and official AutoWiki CLI generation | Existing Factory API credential | Existing organization secret, all 13 repositories | Not exposed by metadata | Unchanged. Hosted model execution awaits quota restoration |
| `FACTORY_WIKI_PR_TOKEN` | Rolling wiki PRs whose creation triggers PR checks | Dedicated fine-grained token, contents/PR write on selected repositories; publish job only | Optional repository or organization secret | Not issued | Absent in organization and all 13 repository metadata. No token created and no release PAT widened. Official `GITHUB_TOKEN` fallback requires Actions PR-creation permission and manual close/reopen to start PR checks |
| `RELEASE_PLEASE_TOKEN` | Lets Release Please PRs trigger CI | Fine-grained token: Contents, Pull requests, and Issues read and write, on the five Release Please repositories only; Metadata read-only; no organization permissions | Organization secret, selected access to exactly those five repositories | 2026-11-18 | Created in the GitHub UI on 2026-10-19; saved five-repository access list verified through the API. Runtime execution pending |
| Tome Keeper release credential | Tome Keeper's existing release setup | Existing | Existing | Existing | Unchanged |
| `GLPUB_TOKEN` | Private package access during builds | Read access to the private package registry | Existing secret destinations | Existing | Inventory pending; reuse as is |
| Factory GitHub App | Review comments and PR access for the official action | App installation permissions | `Jason-Holt-Digital` organization | No expiry | All-repository installation covers all 13 repositories |
| Cloudflare GitHub App | Git builds for the live website | Selected access to `jhd-astro` only | Existing `jhd-astro-web` Worker | Not shown | Reinstalled with approval and reconnected to the transferred repository; builds remain paused |
| `TURNSTILE_SECRET_KEY` | Existing website build secret | Existing JHD Turnstile widget; public sitekey unchanged | Encrypted Cloudflare build entry | Not shown | Rotated with approval on 2026-10-19; encrypted entry verified after reload. Runtime consumption remains `NOT_RUN` |
| Mac mini `gh` login | Local automations: issues, branches, PRs, status issue | Jason's OAuth login | Mac mini keychain | Per GitHub session | `admin:org`, `gist`, `repo`, and `workflow` verified after the passkey check; never used as a CI secret |
| DroidProxy | Local model `custom:droidproxy:gpt-6.1-sol` | Loopback endpoint on the Mac mini | Mac mini only | Per provider login | Smoke runs at high and xhigh passed on the Mac mini; not reachable from hosted runners |
| Linear connector | Intake and source feedback | JHD workspace | Factory integrations | Per connector | Factory UI shows the JHD account with Linear labeled Connected, but the live connection reaches only the Artwod workspace. The JHD connection must be added separately and keep the Artwod one. Not verified |
| Sentry GitHub integration | Linked issues, comment sync, release-aware resolution | JHD organization and mapped repositories | Sentry organization settings | Per integration | Installed; production project mapping verified. UI shows comment sync and Resolve in Next Release, but controls are locked. Both assignment-sync directions are checked. Staging writeback remains unverified |
| Slack connector | Optional alerts | JHD workspace | Factory integrations | Per connector | Factory UI labels it Connected, but the live connection is revoked. Reconnection pending; the core loop does not use Slack |
| PostHog | Evidence for Mythic 1.7 and later | Not requested | None | None | Deferred; do not enable |
| `pub.dev` publisher | `icloud_storage_plus` package publication on numeric tags | Publish that package only | `pub.dev` GitHub environment | Per environment | Required reviewer `kingdomseed`, admin bypass off; approval canary reached human approval with zero executed steps and was cancelled without approval |

## Rules

- Health, Readiness, Triage and CI Steward never receive release or production publishing credentials and never create release tags. Ticket-to-PR is deferred.
- `FACTORY_API_KEY` reaches the official Droid action, its Base Action, the official wiki generation step, and presence checks. No release or production publishing credential is passed to them.
- The wiki generator never receives `FACTORY_WIKI_PR_TOKEN`. Only the separate deterministic wiki-publish job may use it. The Triage model has no issue-write token; only its separate deterministic comment job has issue-write permission.
- A missing credential produces an explicit configuration failure or a paused automation, never a skipped run reported as success.
- When a credential is issued, add its expiry here and nothing else about it.
