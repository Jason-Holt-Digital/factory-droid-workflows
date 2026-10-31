import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "config" / "pstack"


class PstackInstallTest(unittest.TestCase):
    def test_installs_missing_models_without_changing_existing_credentials(self):
        with tempfile.TemporaryDirectory() as temporary:
            home = Path(temporary)
            factory = home / ".factory"
            factory.mkdir()
            catalog = json.loads((SOURCE / "custom-models.json").read_text())
            missing = {
                "custom:opencode-go:muse-spark-1.3-contributor",
                "custom:opencode-go:grok-4.7",
                "custom:opencode-go:mimo-v2.6-pro",
                "custom:opencode-go:gpt-6-luna",
            }
            existing = [
                {
                    **model,
                    "baseUrl": f"https://example.test/{model['provider']}",
                    "apiKey": "local-test-key",
                    "index": index,
                }
                for index, model in enumerate(catalog)
                if model["id"] not in missing
            ]
            haiku = next(m for m in existing if m["id"] == "custom:opencode-go:claude-haiku-5-5")
            haiku["useInRouter"] = False
            settings_path = factory / "settings.json"
            settings_path.write_text(json.dumps({"customModels": existing, "other": "untouched"}))
            env = {**os.environ, "HOME": str(home), "USERPROFILE": str(home)}
            command = [sys.executable, str(SOURCE / "install.py"), "--apply"]

            result = subprocess.run(command, env=env, check=True, capture_output=True, text=True)
            updated = json.loads(settings_path.read_text())
            self.assertNotIn("local-test-key", result.stdout)
            self.assertEqual(updated["other"], "untouched")
            expected = [{**model} for model in existing]
            next(m for m in expected if m["id"] == haiku["id"])["useInRouter"] = True
            self.assertEqual(updated["customModels"][: len(existing)], expected)
            added = updated["customModels"][len(existing) :]
            self.assertEqual({m["id"] for m in added}, missing)
            self.assertTrue(all(m["apiKey"] == "local-test-key" for m in added))
            self.assertEqual(len({m["index"] for m in updated["customModels"]}), len(updated["customModels"]))
            backup = next((factory / "pstack-backups").iterdir())
            self.assertEqual(json.loads((backup / "settings.json").read_text())["customModels"], existing)

    def test_preview_and_install_preserve_existing_files(self):
        with tempfile.TemporaryDirectory() as temporary:
            home = Path(temporary)
            factory = home / ".factory"
            droids = factory / "droids"
            droids.mkdir(parents=True)
            role_map = factory / "pstack-models.md"
            role_map.write_text("previous roles")
            legacy = droids / "proxy-sonnet.md"
            legacy.write_text("previous droid")
            unrelated = droids / "unrelated.md"
            unrelated.write_text("keep me")
            env = {**os.environ, "HOME": str(home), "USERPROFILE": str(home)}
            command = [sys.executable, str(SOURCE / "install.py"), "--retire-legacy"]

            subprocess.run(command, env=env, check=True, capture_output=True, text=True)
            self.assertEqual(role_map.read_text(), "previous roles")
            self.assertTrue(legacy.exists())
            self.assertFalse((factory / "pstack-backups").exists())

            blocked = subprocess.run(command + ["--apply"], env=env, check=False, capture_output=True, text=True)
            self.assertNotEqual(blocked.returncode, 0)
            self.assertEqual(role_map.read_text(), "previous roles")
            models = {model["id"] for model in json.loads((SOURCE / "custom-models.json").read_text())}
            settings = {"customModels": [{"id": model} for model in models]}
            (factory / "settings.json").write_text(json.dumps(settings))
            subprocess.run(command + ["--apply"], env=env, check=True, capture_output=True, text=True)
            self.assertEqual(role_map.read_bytes(), (SOURCE / "pstack-models.md").read_bytes())
            self.assertFalse(legacy.exists())
            self.assertEqual(unrelated.read_text(), "keep me")
            backups = list((factory / "pstack-backups").iterdir())
            self.assertEqual(len(backups), 1)
            self.assertEqual((backups[0] / "pstack-models.md").read_text(), "previous roles")
            self.assertEqual((backups[0] / "droids" / legacy.name).read_text(), "previous droid")
            for source in (SOURCE / "droids").glob("*.md"):
                self.assertEqual((droids / source.name).read_bytes(), source.read_bytes())


if __name__ == "__main__":
    unittest.main()
