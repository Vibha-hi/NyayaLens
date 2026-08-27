from __future__ import annotations

import json
import sqlite3
import sys
import threading
import time
import unittest
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

import numpy as np


SERVICE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_ROOT))

from app.engine import SemanticEngine, VECTOR_SELECTOR_VERSION  # noqa: E402


class _BlockingEmbeddingModel:
    def __init__(self) -> None:
        self.calls = 0
        self._calls_lock = threading.Lock()
        self.started = threading.Event()
        self.release = threading.Event()

    def embed(self, documents: list[str], **_: object):
        with self._calls_lock:
            self.calls += 1
        self.started.set()
        if not self.release.wait(timeout=5):
            raise TimeoutError("Test embedding build was not released")
        return [np.asarray([1.0, 0.0, 0.0], dtype=np.float32) for _ in documents]


def _index_only_engine(corpus_path: Path, model: _BlockingEmbeddingModel) -> SemanticEngine:
    engine = SemanticEngine.__new__(SemanticEngine)
    case_id = "case-1"
    chunk_id = "case-1-passage-1"
    engine._corpus_path = corpus_path
    engine._model = model
    engine._cases = {
        case_id: {
            "id": case_id,
            "title": "A v. B",
            "citation": "2025 INSC 1",
            "legalIssues": ["Property / Land"],
            "chunks": [],
        }
    }
    engine._chunks = {
        chunk_id: {
            "id": chunk_id,
            "case_id": case_id,
            "section": "material facts",
            "paragraph": "1",
            "evidence": "The material facts concern inherited immovable property.",
        }
    }
    engine._chunks_by_case = defaultdict(list, {case_id: [chunk_id]})
    engine._chunk_positions = {chunk_id: 0}
    engine._context_anchor_cache = {}
    engine._citation_context_cache = {}
    engine._primary_profile_cache = {}
    engine._case_issue_cache = {}
    return engine


class IndexRebuildLockTests(unittest.TestCase):
    def test_concurrent_initializers_build_once_and_recheck_after_lock(self) -> None:
        with TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            corpus_path = root / "cases.json"
            corpus_path.write_text(json.dumps({"cases": [{"id": "case-1"}]}), encoding="utf-8")
            database_path = root / "search.db"
            model = _BlockingEmbeddingModel()
            first = _index_only_engine(corpus_path, model)
            second = _index_only_engine(corpus_path, model)

            with patch("app.engine.DB_PATH", database_path):
                with ThreadPoolExecutor(max_workers=2) as executor:
                    first_future = executor.submit(first._ensure_index)
                    self.assertTrue(model.started.wait(timeout=5))
                    second_future = executor.submit(second._ensure_index)
                    time.sleep(0.1)
                    model.release.set()
                    first_future.result(timeout=10)
                    second_future.result(timeout=10)

            database = sqlite3.connect(database_path)
            try:
                vector_count = database.execute(
                    "SELECT COUNT(*) FROM case_embeddings"
                ).fetchone()[0]
                selector = database.execute(
                    "SELECT value FROM index_meta WHERE key='vector_selector_version'"
                ).fetchone()[0]
            finally:
                database.close()

            self.assertEqual(model.calls, 1)
            self.assertEqual(vector_count, 2)
            self.assertEqual(selector, VECTOR_SELECTOR_VERSION)


if __name__ == "__main__":
    unittest.main()
