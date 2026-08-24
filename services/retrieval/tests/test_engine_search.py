import sys
import unittest
from pathlib import Path


SERVICE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_ROOT))

from app.engine import SemanticEngine
from app.models import SearchFilters


class SemanticEngineSearchTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.engine = SemanticEngine()

    def test_default_bail_query_returns_relevant_source_linked_results(self) -> None:
        response = self.engine.search(
            "The statutory investigation period expired, giving a right to default bail under Section 167(2).",
            SearchFilters(),
            5,
        )
        self.assertTrue(response.results)
        self.assertIn("bail", response.results[0].matchedEvidence.lower())
        self.assertTrue(response.results[0].caseSummary)
        self.assertTrue(response.results[0].trialStatus)
        self.assertTrue(response.results[0].winner)
        self.assertTrue(response.results[0].relevanceBasis)
        self.assertTrue(response.results[0].caseStage)
        self.assertIn(response.results[0].caseStageConfidence, {"High", "Medium", "Low"})
        self.assertTrue(response.results[0].caseStageEvidence)
        self.assertTrue(response.results[0].outcomeRelief)
        self.assertTrue(response.results[0].authorityBasis)
        self.assertGreaterEqual(response.results[0].authorityScore, 0)
        self.assertTrue(response.results[0].sourceUrl)

    def test_year_filter_is_applied_to_both_retrieval_branches(self) -> None:
        year = "2024" if self.engine.corpus_version.startswith("import-") else "2022"
        response = self.engine.search(
            "Regular bail after long custody because the trial is delayed and liberty is affected.",
            SearchFilters(year=year),
            5,
        )
        self.assertTrue(response.results)
        self.assertTrue(all(result.year == year for result in response.results))

    def test_high_court_filter_excludes_supreme_court(self) -> None:
        if not any(case["court"] == "High Court" for case in self.engine._cases.values()):
            self.skipTest("The bundled fallback corpus contains Supreme Court decisions only")
        response = self.engine.search(
            "The accused seeks regular bail in an NDPS case after prolonged custody and trial delay.",
            SearchFilters(court="High Court"),
            5,
        )
        self.assertTrue(response.results)
        self.assertTrue(all(result.court != "Supreme Court" for result in response.results))

    def test_out_of_domain_query_returns_no_legal_results(self) -> None:
        response = self.engine.search(
            "Banana recipes and ocean weather forecasts for a weekend holiday.",
            SearchFilters(),
            5,
        )
        self.assertEqual(response.results, [])


if __name__ == "__main__":
    unittest.main()
