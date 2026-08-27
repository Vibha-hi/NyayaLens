from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path


SERVICE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_ROOT))

from evaluate import (  # noqa: E402
    evaluate_ranking,
    pairwise_preference_at,
    percentile,
    persist_json_report,
    rrf_fuse_case_rankings,
    validate_qrel_case_ids,
)


class RetrievalEvaluationTests(unittest.TestCase):
    def test_unjudged_results_are_unknown_not_false_positives(self) -> None:
        scores = evaluate_ranking(
            ["unknown-a", "relevant", "unknown-b", "unknown-c", "unknown-d"],
            {"id": "sparse", "query": "query", "relevance": {"relevant": 2}},
        )
        self.assertEqual(scores["judgedPrecision@5"], 1.0)
        self.assertEqual(scores["judgedCoverage@5"], 0.2)
        self.assertEqual(scores["unjudgedResults@5"], 4)
        self.assertIsNone(scores["explicitContradictionRateAmongJudged@5"])

    def test_explicit_contradictions_are_measured_only_when_reviewed(self) -> None:
        scores = evaluate_ranking(
            ["contrary", "relevant", "unknown"],
            {
                "id": "contrast",
                "query": "query",
                "relevance": {"relevant": 2},
                "contradictory": ["contrary"],
            },
        )
        self.assertEqual(scores["explicitContradictionRateAmongJudged@5"], 0.5)
        self.assertEqual(scores["explicitContradictionQueryHit@5"], 1.0)

    def test_pairwise_metric_respects_graded_preference(self) -> None:
        accuracy, coverage = pairwise_preference_at(
            ["best", "acceptable", "irrelevant"],
            {"best": 3, "acceptable": 1, "irrelevant": 0},
        )
        self.assertEqual(accuracy, 1.0)
        self.assertEqual(coverage, 1.0)

    def test_plain_rrf_fuses_case_rankings_without_reranker(self) -> None:
        ranked = rrf_fuse_case_rankings(
            ["dense-first", "shared-best", "shared-second"],
            ["shared-best", "shared-second", "lexical-only"],
            k=60,
        )
        self.assertEqual(ranked[:2], ["shared-best", "shared-second"])
        self.assertIn("dense-first", ranked)
        self.assertIn("lexical-only", ranked)

    def test_qrel_ids_must_exist_in_active_corpus(self) -> None:
        golden = [
            {
                "id": "corpus-mismatch",
                "query": "A sufficiently detailed legal evaluation query.",
                "relevance": {"present": 3, "missing": 0},
            }
        ]
        with self.assertRaisesRegex(ValueError, "missing"):
            validate_qrel_case_ids(golden, {"present"})
        validate_qrel_case_ids(golden, {"present", "missing"})

    def test_qrel_grade_scale_is_limited_to_zero_through_three(self) -> None:
        with self.assertRaisesRegex(ValueError, "0 to 3"):
            evaluate_ranking(
                ["case"],
                {"id": "bad-grade", "query": "query", "relevance": {"case": 4}},
            )

    def test_latency_percentiles_are_interpolated(self) -> None:
        self.assertEqual(percentile([1.0, 2.0, 3.0, 4.0], 0.50), 2.5)
        self.assertEqual(percentile([1.0, 2.0, 3.0, 4.0], 0.95), 3.85)
        self.assertIsNone(percentile([], 0.95))

    def test_json_report_can_be_persisted_without_suppressing_payload(self) -> None:
        report = {"corpusVersion": "test-corpus", "metrics": {"dense": {}}}
        with tempfile.TemporaryDirectory() as directory:
            output_path = Path(directory) / "nested" / "evaluation.json"
            rendered = persist_json_report(report, output_path)
            self.assertEqual(json.loads(rendered), report)
            self.assertEqual(json.loads(output_path.read_text(encoding="utf-8")), report)


if __name__ == "__main__":
    unittest.main()
