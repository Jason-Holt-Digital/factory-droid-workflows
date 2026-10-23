# Glossary

These terms distinguish intended policy, installed configuration, and observed execution. Definitions come from `README.md`, `config/jhd.json`, `automations/COMMON.md`, and `docs/OPERATIONS.md`.

| Term | Meaning |
| --- | --- |
| Prepared | Files or prompts exist; nothing is yet claimed installed or enabled. |
| Configured | Installed or switched on, but the required real outcome has not been proven. |
| Verified | A real run produced the specified observable result. A no-op green job does not qualify. |
| Deferred | Outside the approved phase. Worker and Intake retain paused no-op registrations; this is not a repository rollout state. |
| `NOT_RUN` | A check was not performed. Its reason must be reported. |
| Control root | The canonical clone containing `automations/COMMON.md` and `config/jhd.json`. Local installed prompts substitute its absolute path for `{{CONTROL_ROOT}}`. |
| Canonical checkout | Clean main checkout equal to origin/main after a fast-forward pull; required for normal local runs. |
| Canary | A bounded manual run against named targets whose actual output is inspected before wider activation. |
| Native automation | A local Factory registration that runs a prompt on the Mac mini. Its cloud-list entry is a mirror, not another schedule. |
| Rolling wiki branch | `factory/droid-wiki`, restored by `.github/workflows/droid-wiki-refresh.yml` so unmerged generated pages can seed the next refresh. |
| CI Steward | An event-driven upstream Droid mode for diagnosing eligible CI failures, with separately enabled bounded fixes. |
| Triage | New-issue classification and a human routing suggestion, not implementation authorization. |
| Readiness | An official stored repository assessment. Remediation through `/readiness-fix` is a separate approval decision. |
| Queue labels | Names in `config/jhd.json`, such as `automation:ready` and `automation:paused`. Their existence does not authorize deferred work. |
| Source ID | Stable `linear:<issue UUID>` or `sentry:<numeric issue ID>` identity, specified in `automations/COMMON.md`. |
| Source ownership | GitHub owns execution/PR/verification data; Linear owns scope/acceptance/priority; Sentry owns error evidence/release resolution. |
| Human gate | A release, publication, or production action left to a person. A successful approval-wait canary is not a successful publication. |

See [Data models](../reference/data-models.md) for machine-readable records and [Deployment](../deployment.md) for how these states affect activation.
