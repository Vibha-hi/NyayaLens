import importlib.util
import json
import tempfile
import unittest
import zipfile
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[3]
SCRIPT_PATH = PROJECT_ROOT / "scripts" / "setup_retrieval.py"
SPEC = importlib.util.spec_from_file_location("setup_retrieval", SCRIPT_PATH)
assert SPEC and SPEC.loader
setup_retrieval = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(setup_retrieval)


class ReleaseSetupTests(unittest.TestCase):
    def test_bundle_manifest_is_finalized(self) -> None:
        manifest = json.loads((PROJECT_ROOT / "services" / "retrieval" / "bundle_manifest.json").read_text())
        self.assertRegex(manifest["sha256"], r"^[0-9a-f]{64}$")
        self.assertEqual(manifest["caseCount"], 1412)
        self.assertEqual(manifest["chunkCount"], 45210)

    def test_safe_extraction_accepts_only_runtime_directories(self) -> None:
        original_root = setup_retrieval.PROJECT_ROOT
        try:
            with tempfile.TemporaryDirectory() as temporary:
                root = Path(temporary)
                setup_retrieval.PROJECT_ROOT = root
                valid = root / "valid.zip"
                with zipfile.ZipFile(valid, "w") as archive:
                    archive.writestr("services/retrieval/data/import/cases.json", "{}")
                setup_retrieval.extract_safely(valid)
                self.assertEqual(
                    (root / "services" / "retrieval" / "data" / "import" / "cases.json").read_text(),
                    "{}",
                )

                invalid = root / "invalid.zip"
                with zipfile.ZipFile(invalid, "w") as archive:
                    archive.writestr("data/incoming/../../.env", "secret")
                with self.assertRaises(RuntimeError):
                    setup_retrieval.extract_safely(invalid)
                self.assertFalse((root / ".env").exists())
        finally:
            setup_retrieval.PROJECT_ROOT = original_root


if __name__ == "__main__":
    unittest.main()
