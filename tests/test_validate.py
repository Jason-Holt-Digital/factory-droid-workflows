import json
import unittest

from scripts.validate import ROOT, validate


class PolicyValidationTest(unittest.TestCase):
    def setUp(self):
        self.config = json.loads((ROOT / "config/jhd.json").read_text())

    def test_staged_rollout_is_valid(self):
        self.assertEqual([], validate(self.config))

    def test_deferred_automations_cannot_poll(self):
        for name in ("ticket_to_pr", "source_intake"):
            with self.subTest(name=name):
                self.config["automation_policy"][name]["schedule"] = "7 * * * *"
                self.assertIn(
                    f"{name} must remain deferred without a schedule.",
                    validate(self.config),
                )
                self.config["automation_policy"][name]["schedule"] = None

    def test_rejects_frequent_recurring_runs(self):
        for name in ("health", "digest", "readiness"):
            with self.subTest(name=name):
                schedule = self.config["automation_policy"][name]["schedule"]
                self.config["automation_policy"][name]["schedule"] = "0 * * * *"
                self.assertTrue(
                    any(f"{name} must use" in e for e in validate(self.config))
                )
                self.config["automation_policy"][name]["schedule"] = schedule

    def test_weekly_outcomes_are_bounded(self):
        self.config["automation_policy"]["health"]["max_pull_requests"] = 2
        self.config["automation_policy"]["digest"]["lookback_days"] = 1
        errors = validate(self.config)
        self.assertTrue(any("one maintenance PR" in e for e in errors))
        self.assertTrue(any("seven days" in e for e in errors))

    def test_readiness_cannot_start_remediation(self):
        self.config["automation_policy"]["readiness"]["remediation"] = True
        self.assertTrue(any("without remediation" in e for e in validate(self.config)))

    def test_triage_cannot_start_implementation(self):
        for key in ("implementation", "automatic_ready"):
            with self.subTest(key=key):
                self.config["automation_policy"]["triage"][key] = True
                self.assertTrue(
                    any("classify new issues" in e for e in validate(self.config))
                )
                self.config["automation_policy"]["triage"][key] = False

    def test_publishing_cannot_be_automated(self):
        for field in (
            "automatic_release_merges",
            "automatic_tag_creation",
            "automatic_production_deployments",
        ):
            with self.subTest(field=field):
                self.config[field] = True
                self.assertIn(f"{field} must be false.", validate(self.config))
                self.config[field] = False

    def test_steward_rejects_feedback_loops_and_unbounded_repairs(self):
        self.config["ci_steward"]["watch_ai_workflows"] = True
        self.config["ci_steward"]["max_fix_commits"] = 3
        errors = validate(self.config)
        self.assertTrue(any("AI or release" in error for error in errors))
        self.assertTrue(any("max_fix_commits" in error for error in errors))

    def test_bot_wildcard_is_not_trusted(self):
        self.config["trusted_bots"] = ["*"]
        self.assertTrue(any("explicitly named" in e for e in validate(self.config)))

    def test_unverified_repo_cannot_enable_merges(self):
        self.config["repositories"][0]["automerge"] = True
        self.assertTrue(any("deployment audit" in e for e in validate(self.config)))

    def test_package_gate_requires_observed_canary(self):
        repo = next(
            r for r in self.config["repositories"] if r["release"] == "tag-pubdev"
        )
        repo.update(automerge=True, deployment_audited=True, state="verified")
        repo["human_gate_canary_verified"] = False
        self.assertTrue(any("publisher approval" in e for e in validate(self.config)))
        repo["human_gate_canary_verified"] = True
        self.assertEqual([], validate(self.config))

    def test_duplicate_and_escaped_paths_are_invalid(self):
        self.config["repositories"][1]["name"] = self.config["repositories"][0]["name"]
        self.config["repositories"][0]["path"] = "../outside"
        errors = validate(self.config)
        self.assertTrue(any("unique" in e for e in errors))
        self.assertTrue(any("repo root" in e for e in errors))

    def test_read_access_does_not_prove_source_feedback(self):
        self.config["sources"]["sentry"]["state"] = "verified"
        self.assertTrue(any("source feedback" in e for e in validate(self.config)))

    def test_source_identity_and_repository_are_required(self):
        self.config["sources"]["linear"]["state"] = "verified"
        self.config["sources"]["sentry"]["project_mappings"][0]["repository"] = "other"
        errors = validate(self.config)
        self.assertTrue(any("workspace identity" in e for e in errors))
        self.assertTrue(any("unconfigured repository" in e for e in errors))


if __name__ == "__main__":
    unittest.main()
