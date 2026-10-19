import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATES = {"prepared", "configured", "verified"}
KINDS = {
    "flutter",
    "flutter-workspace",
    "dart-library",
    "flutter-plugin",
    "dart-web",
    "typescript-web",
    "skills",
    "sources",
    "automation",
}


def validate(config):
    errors = []
    if config["production_approval"] != "human":
        errors.append("Production approval must remain human.")
    for key in (
        "automatic_release_merges",
        "automatic_tag_creation",
        "automatic_production_deployments",
    ):
        if config[key] is not False:
            errors.append(f"{key} must be false.")
    if "*" in config["trusted_bots"]:
        errors.append("Trusted bots must be explicitly named.")
    policy = config["automation_policy"]
    for name in ("ticket_to_pr", "source_intake"):
        if policy[name]["state"] != "deferred" or policy[name]["schedule"] is not None:
            errors.append(f"{name} must remain deferred without a schedule.")
    for name, schedule in (
        ("health", "0 3 * * 3"),
        ("digest", "30 7 * * 1"),
        ("readiness", "0 3 1 * *"),
    ):
        if policy[name]["schedule"] != schedule:
            errors.append(f"{name} must use the approved cadence: {schedule}.")
    if policy["health"]["max_pull_requests"] != 1:
        errors.append("Health may open at most one maintenance PR per week.")
    if policy["digest"]["lookback_days"] != 7:
        errors.append("Weekly Digest must cover seven days.")
    readiness = policy["readiness"]
    if readiness["remediation"] is not False or readiness["max_repositories"] != 2:
        errors.append(
            "Readiness must assess at most two repositories without remediation."
        )
    triage = policy["triage"]
    if (
        triage["trigger"] != "issues.opened"
        or triage["implementation"] is not False
        or triage["automatic_ready"] is not False
    ):
        errors.append(
            "Triage must classify new issues without implementation or ready labels."
        )
    steward = config["ci_steward"]
    for key, maximum in (
        ("max_retries", 1),
        ("max_fix_commits", 2),
        ("max_invocations", 10),
    ):
        if type(steward[key]) is not int or not 0 <= steward[key] <= maximum:
            errors.append(f"ci_steward.{key} must be between zero and {maximum}.")
    if steward["watch_ai_workflows"] or steward["watch_release_workflows"]:
        errors.append("CI Steward must not watch AI or release workflows.")
    names = [repo["name"] for repo in config["repositories"]]
    if len(names) != len(set(names)):
        errors.append("Repository names must be unique.")
    linear = config["sources"]["linear"]
    sentry = config["sources"]["sentry"]
    if linear["state"] == "verified" and (
        not linear["workspace_verified"] or not linear["workspace_id"]
    ):
        errors.append("Linear requires a verified JHD workspace identity.")
    if sentry["state"] == "verified" and (
        not sentry["writeback_verified"] or not sentry["native_integration_verified"]
    ):
        errors.append("Sentry requires verified native linking and source feedback.")
    for mapping in [*linear["team_mappings"], *sentry["project_mappings"]]:
        if mapping["repository"] not in names:
            errors.append("Source mapping refers to an unconfigured repository.")
    for repo in config["repositories"]:
        name = repo["name"]
        if repo["state"] not in STATES:
            errors.append(f"{name}: invalid verification state.")
        if repo["kind"] not in KINDS:
            errors.append(f"{name}: unsupported check category.")
        path = Path(repo["path"])
        if path.is_absolute() or ".." in path.parts:
            errors.append(f"{name}: repository path must stay under the repo root.")
        if repo["automerge"] and (
            repo["state"] != "verified" or not repo["deployment_audited"]
        ):
            errors.append(
                f"{name}: automatic merge requires verified deployment audit."
            )
        if (
            repo["release"] == "tag-pubdev"
            and repo["automerge"]
            and not repo.get("human_gate_canary_verified")
        ):
            errors.append(
                f"{name}: publisher approval must be proven before auto-merge."
            )
    return errors


def main():
    config = json.loads((ROOT / "config/jhd.json").read_text())
    errors = validate(config)
    for error in errors:
        print(error)
    if errors:
        raise SystemExit(1)
    print(f"Validated policy and {len(config['repositories'])} repository entries.")


if __name__ == "__main__":
    main()
