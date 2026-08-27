import sys
import unittest
from collections import defaultdict
from pathlib import Path


SERVICE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_ROOT))

from app.engine import SemanticEngine, extract_related_case_mentions  # noqa: E402


REFERENCE_TEXT = """
In fact, on behalf of the State, it has fairly been conceded that the State is not
going for recovery. This Court has already held that in view of the judgments passed
by the Hon'ble Supreme Court in the case of State of Punjab & others Vs. Rafiq Masih
(White Washer), reported in (2015) 4 SCC 334 and in Thomas Daniel v. State of Kerala
and others, 2022 SCC OnLine SC 536, excess amount cannot be recovered.
"""


def make_case(
    case_id: str,
    title: str,
    citation: str,
    evidence: str,
    *,
    source_url: str = "",
) -> dict:
    return {
        "id": case_id,
        "title": title,
        "citation": citation,
        "court": "Supreme Court",
        "courtName": "Supreme Court of India",
        "year": 2022,
        "category": "Service Law",
        "sourceUrl": source_url,
        "chunks": [
            {
                "id": f"{case_id}-passage-1",
                "section": "Court reasoning",
                "paragraph": "PDF page 1",
                "evidence": evidence,
            }
        ],
    }


def graph_engine(cases: list[dict]) -> SemanticEngine:
    engine = SemanticEngine.__new__(SemanticEngine)
    engine._cases = {case["id"]: case for case in cases}
    engine._chunks = {
        chunk["id"]: {**chunk, "case_id": case["id"]}
        for case in cases
        for chunk in case["chunks"]
    }
    engine._chunks_by_case = defaultdict(list)
    for chunk_id, chunk in engine._chunks.items():
        engine._chunks_by_case[chunk["case_id"]].append(chunk_id)
    engine._reference_lookups = None
    return engine


class RelatedCaseExtractionTests(unittest.TestCase):
    def test_extracts_named_cases_and_reported_citations(self) -> None:
        mentions = extract_related_case_mentions(REFERENCE_TEXT)

        self.assertEqual(
            [(mention.title, mention.citation) for mention in mentions],
            [
                ("State of Punjab & others v. Rafiq Masih", "(2015) 4 SCC 334"),
                ("Thomas Daniel v. State of Kerala and others", "2022 SCC OnLine SC 536"),
            ],
        )
        self.assertTrue(all("excess amount cannot be recovered" in item.evidence for item in mentions))

    def test_resolves_corpus_case_and_keeps_missing_case_as_reference_node(self) -> None:
        source = make_case(
            "source-case",
            "Employee v. State",
            "2025:UKHC:100",
            REFERENCE_TEXT,
            source_url="https://indiankanoon.org/doc/100/",
        )
        rafiq = make_case(
            "rafiq-masih",
            "State of Punjab & Ors v. Rafiq Masih (White Washer)",
            "(2015) 4 SCC 334",
            "The appeal concerns recovery from government employees.",
            source_url="https://indiankanoon.org/doc/200/",
        )
        response = graph_engine([source, rafiq]).case_graph(["source-case"])

        self.assertEqual(response.relatedCaseCount, 2)
        self.assertEqual(response.resolvedRelatedCaseCount, 1)
        self.assertEqual(response.unresolvedRelatedCaseCount, 1)
        self.assertEqual(response.citationEdgeCount, 2)
        resolved = next(node for node in response.nodes if node.id == "rafiq-masih")
        unresolved = next(node for node in response.nodes if not node.availableInCorpus)
        self.assertTrue(resolved.availableInCorpus)
        self.assertEqual(resolved.sourceUrl, "https://indiankanoon.org/doc/200/")
        self.assertEqual(unresolved.title, "Thomas Daniel v. State of Kerala and others")
        self.assertIsNone(unresolved.sourceUrl)

    def test_returns_explicit_empty_related_case_counts(self) -> None:
        source = make_case(
            "standalone",
            "Standalone Petitioner v. State",
            "2025:UKHC:101",
            "The petition is decided on its own facts without referring to another judgment.",
        )
        response = graph_engine([source]).case_graph(["standalone"])

        self.assertEqual(response.relatedCaseCount, 0)
        self.assertEqual(response.citationEdgeCount, 0)
        self.assertEqual(len(response.nodes), 1)
        self.assertEqual(response.edges, [])


if __name__ == "__main__":
    unittest.main()
