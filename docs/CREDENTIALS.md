# Credentials

Metadata only. Values never appear in this repository, in prompts, in command arguments, in logs, or in uploaded artifacts. Existing credentials are reused; replacing or rotating one needs Jason's approval. Check for an existing credential, including organization-level secrets, before creating one, so no duplicate is made.

Each runtime uses the identity it actually runs as. A hosted runner or GitHub Actions job does not inherit the Mac mini's personal `gh`, Linear, Sentry, or DroidProxy login.

| Credential | Purpose | Scope | Destination | Expiry | Status |
|---|---|---|---|---|---|
| `FACTORY_API_KEY` | Official Droid action: review, security review, `@droid` mentions, CI Steward | Existing Factory API credential | Existing organization secret, all repositories, covering the 13 targets | Not exposed by metadata | Unchanged. A hosted review reached Factory but model execution failed at the weekly usage limit with Extra Usage empty |
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

- Workers, health runs, readiness runs, and CI Steward never receive publishing credentials and never create release tags.
- `FACTORY_API_KEY` reaches only the official Droid action and the step that checks it is present. No release or publishing credential is passed to the review, mention, or CI Steward workflows.
- A missing credential produces an explicit configuration failure or a paused automation, never a skipped run reported as success.
- When a credential is issued, add its expiry here and nothing else about it.
