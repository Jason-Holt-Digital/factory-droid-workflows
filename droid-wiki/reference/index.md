# Reference

These pages describe declared policy, exchanged records and external dependencies. They distinguish repository declarations from hardcoded workflow behavior and from live operational evidence.

| Page | Contents |
|---|---|
| [Configuration](configuration.md) | Policy keys, all 13 repositories, source enrollment, workflow controls and external native settings |
| [Data models](data-models.md) | Rollout states, ownership, stable IDs, labels, triage JSON, run evidence and wiki metadata |
| [Dependencies](dependencies.md) | Action families and exact pins, mutable exceptions, local tools and runtime/service identities |

## Canonical sources

- `config/jhd.json`: declared delivery policy and repository catalog.
- `scripts/validate.py`: selected policy assertions, not a complete schema or YAML audit.
- `docs/OPERATIONS.md`: activation, canaries, pause/resume and production ownership.
- `docs/CREDENTIALS.md`: credential names, purposes, scopes and recorded verification gaps; never values.
- `docs/PROVENANCE.md`: upstream pins and historical outcomes.
- `automations/COMMON.md`: local runtime, ownership, trust and run-record rules.

For behavior, use the [feature pages](../features/index.md). For activation and trust decisions, read [deployment](../deployment.md) and [security](../security.md). Historical records do not substitute for a current approved canary.
