import unittest

from app.engine import SemanticEngine
from app.models import SearchFilters


class SemanticEngineSearchTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.engine = SemanticEngine()

    def test_default_bail_query_ranks_bikramjit_first(self) -> None:
        response = self.engine.search(
            "The statutory investigation period expired, giving a right to default bail under Section 167(2).",
            SearchFilters(),
            5,
        )
        self.assertEqual(response.results[0].id, "sc-bikramjit-singh-2020")

    def test_year_filter_is_applied_to_both_retrieval_branches(self) -> None:
        response = self.engine.search(
            "Regular bail after long custody because the trial is delayed and liberty is affected.",
            SearchFilters(year="2022"),
            5,
        )
        self.assertEqual([result.id for result in response.results], ["sc-satender-kumar-antil-2022"])

    def test_out_of_domain_query_returns_no_legal_results(self) -> None:
        response = self.engine.search(
            "Banana recipes and ocean weather forecasts for a weekend holiday.",
            SearchFilters(),
            5,
        )
        self.assertEqual(response.results, [])


if __name__ == "__main__":
    unittest.main()
