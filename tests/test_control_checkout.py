import shlex
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COMMON = ROOT / "automations/COMMON.md"


class ControlCheckoutTest(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix="factory-control-")
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.origin = self.root / "origin.git"
        self.seed = self.root / "seed"
        self.checkout = self.root / "control checkout"
        self.git(self.root, "clone", "--bare", str(ROOT), str(self.origin))
        self.tip = self.git(self.origin, "rev-parse", "HEAD")
        self.base = self.git(self.origin, "rev-parse", "HEAD^")
        self.git(self.origin, "update-ref", "refs/heads/main", self.base)
        self.git(self.origin, "update-ref", "refs/heads/fixture-tip", self.tip)
        self.git(
            self.root, "clone", "--branch", "main", str(self.origin), str(self.seed)
        )
        self.git(
            self.root, "clone", "--branch", "main", str(self.origin), str(self.checkout)
        )

    def git(self, directory, *args):
        return subprocess.run(
            ["git", "-C", str(directory), *args],
            check=True,
            capture_output=True,
            text=True,
        ).stdout.strip()

    def setup_command(self):
        command = COMMON.read_text().split("1. Run `", 1)[1].split("`", 1)[0]
        command = command.replace("'<absolute path>'", shlex.quote(str(self.checkout)))
        return subprocess.run(
            ["sh", "-c", command],
            check=False,
            cwd=self.root,
            capture_output=True,
            text=True,
        )

    def checkout_state(self):
        return tuple(
            self.git(self.checkout, *args)
            for args in (
                ("rev-parse", "HEAD"),
                ("branch", "--show-current"),
                ("status", "--porcelain"),
            )
        )

    def assert_setup_rejected(self):
        before = self.checkout_state()
        result = self.setup_command()
        self.assertNotEqual(0, result.returncode, result.stdout + result.stderr)
        self.assertEqual(before, self.checkout_state())

    def test_clean_main_fast_forwards_from_origin(self):
        self.git(self.seed, "merge", "--ff-only", self.tip)
        self.git(self.seed, "push", "origin", "main")
        expected = self.git(self.seed, "rev-parse", "HEAD")
        self.assertNotEqual(expected, self.git(self.checkout, "rev-parse", "HEAD"))
        result = self.setup_command()
        self.assertEqual(0, result.returncode, result.stdout + result.stderr)
        self.assertEqual(expected, self.git(self.checkout, "rev-parse", "HEAD"))
        self.assertEqual(expected, self.git(self.checkout, "rev-parse", "origin/main"))
        self.assertEqual(("main", ""), self.checkout_state()[1:])

    def test_rejects_untracked_files(self):
        (self.checkout / "untracked.txt").write_text("local\n")
        self.assert_setup_rejected()

    def test_rejects_modified_files(self):
        (self.checkout / "README.md").write_text("local\n")
        self.assert_setup_rejected()

    def test_rejects_staged_files(self):
        (self.checkout / "README.md").write_text("local\n")
        self.git(self.checkout, "add", "README.md")
        self.assert_setup_rejected()

    def test_rejects_non_main_branch(self):
        self.git(self.checkout, "switch", "--track", "-c", "feature", "origin/main")
        self.assert_setup_rejected()

    def test_rejects_detached_head(self):
        self.git(self.checkout, "checkout", "--detach", "HEAD")
        self.assert_setup_rejected()

    def test_rejects_main_ahead_of_origin(self):
        self.git(self.checkout, "merge", "--ff-only", self.tip)
        self.assert_setup_rejected()


if __name__ == "__main__":
    unittest.main()
