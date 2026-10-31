# Pstack role map for Factory Droid.
# Panel entries run as separate seats; validator fallbacks replace failed validators.
# Prefer Opus medium for judgment and prose, with high for difficult judgment.
# Never assign Argon to heavy implementation or full GLM-5.3 to visual analysis.
# Prefer current-generation models. Sonnet reasoning must not exceed high.
# Heavy implementation: Opus high, Sol high/xhigh, or Astra high.
# General implementation includes Argon high, Terra high, Sonnet medium/high,
# Sol medium/high, Opus medium, Grok 4.7, and GLM-5.3.
# Sol may implement; Kimi may validate. These choices differ from droid-host.
# Use inexpensive readers for search, and smaller models for computer maintenance.
# For package-manager and file-maintenance work, Terra is the model-size ceiling.
# Validation order: Sol, Kimi, Astra, then Terra as the last fallback.
# Validate against real surfaces and report blocked or incomplete checks honestly.
# Kimi is for design and validation, not general work or code review.
# Design exploration starts with Kimi, then Opus, followed by cost-sensitive options.
# Never silently accept a parent-model fallback when a pinned model is unavailable.
# Screen contributor-tier briefs before sending them to a provider.
# Named personal targets and extra fallback roles require pstack support to route them.

orchestration: droid:claude-opus-medium, droid:codex-sol-high, droid:codex-astra-high
main: droid:claude-opus-medium
judgment and prose: droid:claude-opus-medium
feature, refactoring: droid:ag-argon-high
bug-fix: droid:ag-opus-high
perf-issue: droid:ag-opus-high
hillclimb: droid:ag-opus-high
special cases: droid:ag-opus-high
hardest tasks: droid:ag-opus-high
very simple tasks: droid:go-glm-flash-high, droid:go-haiku-high, droid:pstack-gemini-flash
around the computer: droid:go-glm-maintainer, droid:go-glm-flash-high, droid:go-haiku-high, droid:codex-terra-maintainer
swarm workers: droid:ag-argon-high
arena runners: droid:ag-argon-high, droid:codex-terra-high, droid:ag-opus-high, droid:pstack-sonnet
architect runners: droid:ag-argon-high, droid:codex-terra-high, droid:ag-opus-high, droid:pstack-sonnet
arena cross-judge pool: droid:pstack-sol-validator
code review: droid:codex-astra-reviewer, droid:pstack-sol-validator, droid:go-glm-reviewer, droid:grok-4-7-reviewer, droid:go-deepseek-reviewer
docs updates: droid:go-glm-flash-high, droid:go-haiku-high, droid:pstack-gemini-flash
retrieval and search: droid:go-haiku-reader, droid:go-luna-reader, droid:pstack-glm-flash-reader, droid:pstack-gemini-flash-reader
how explorer: droid:pstack-gemini-flash-reader
how explainer: droid:claude-opus-reader
why investigators: droid:pstack-gemini-flash-reader
why synthesizer: droid:claude-opus-reader
reflect tooling: droid:pstack-gemini-flash-reader
reflect judgment, divergent, synthesizer: droid:claude-opus-reader
interrogate reviewers: droid:pstack-sol-validator, droid:go-glm-reviewer, droid:grok-4-7-reviewer, droid:pstack-opus-high-reader
verification and validation: droid:codex-sol-validator
verification and validation fallback: droid:go-kimi-validator
validation escalation: droid:codex-astra-validator
last resort validation: droid:codex-terra-xhigh-validator
final gate: droid:claude-opus-reader
design and comping: droid:go-kimi-designer, droid:claude-opus-medium, droid:go-muse-designer, droid:codex-sol-high, droid:ag-sonnet-high, droid:ag-argon-high, droid:go-deepseek-designer, droid:go-mimo-designer, droid:codex-astra-high, droid:pstack-kimi-k3
design evaluation: droid:claude-opus-reader
