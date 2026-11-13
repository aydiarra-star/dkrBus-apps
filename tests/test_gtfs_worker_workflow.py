from __future__ import annotations

import unittest
from pathlib import Path


WORKFLOW = (
    Path(__file__).resolve().parents[1]
    / ".github"
    / "workflows"
    / "dakar-gtfs-validation-worker.yml"
)


class GTFSWorkerWorkflowTests(unittest.TestCase):
    def test_worker_is_manual_main_only_and_requires_explicit_confirmation(self) -> None:
        content = WORKFLOW.read_text(encoding="utf-8")
        self.assertIn("workflow_dispatch:", content)
        self.assertIn("confirm_process:", content)
        self.assertIn("default: false", content)
        self.assertIn(
            "if: github.ref == 'refs/heads/main' && inputs.confirm_process == true",
            content,
        )
        self.assertIn("environment: dakar-bus-private-validation", content)
        self.assertNotRegex(content, r"(?m)^  (push|schedule):")


if __name__ == "__main__":
    unittest.main()
