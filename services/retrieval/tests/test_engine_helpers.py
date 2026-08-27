import sqlite3
import sys
import unittest
from pathlib import Path


SERVICE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_ROOT))

from app.engine import (  # noqa: E402
    AUTHORITY_RERANK_WEIGHT,
    LEGAL_RERANK_WEIGHT,
    RRF_K,
    SemanticEngine,
    extract_signals,
    is_legal_query,
    lexical_fts_clauses,
    lexical_query_plan,
    lexical_tokens,
)
from app.models import SearchFilters, SearchRequest  # noqa: E402


class EngineHelperTests(unittest.TestCase):
    def test_extracts_legal_synonyms_and_sections(self) -> None:
        signals = extract_signals(
            "Pre-arrest bail is requested under Section 438 because there is no risk the applicant will abscond."
        )
        self.assertIn("Anticipatory Bail", signals)
        self.assertIn("Flight Risk", signals)
        self.assertIn("Section 438", signals)

    def test_lexical_tokens_remove_common_words(self) -> None:
        self.assertEqual(
            lexical_tokens("The applicant seeks bail under Section 439"),
            ["bail", "439"],
        )

    def test_generic_legal_words_never_vote_independently(self) -> None:
        self.assertEqual(
            lexical_tokens(
                "The allegation, evidence, petitioner, respondent, judgment and relief "
                "concern witness intimidation."
            ),
            ["concern", "witness", "intimidation"],
        )

    def test_negated_content_is_not_emitted_as_a_positive_keyword(self) -> None:
        query = (
            "There is no allegation that the accused may abscond or influence witnesses. "
            "The trial remains delayed."
        )
        tokens, signals = lexical_query_plan(query)
        pairs = {(signal.negator, signal.target) for signal in signals}
        self.assertNotIn("abscond", tokens)
        self.assertNotIn("influence", tokens)
        self.assertNotIn("witnesses", tokens)
        self.assertIn(("no", "allegation"), pairs)
        self.assertIn(("no", "abscond"), pairs)
        self.assertIn(("no", "influence"), pairs)
        self.assertIn(("no", "witnesses"), pairs)
        self.assertIn("trial", tokens)
        self.assertIn("delayed", tokens)

    def test_fts_uses_negation_and_structured_phrases(self) -> None:
        clauses, tokens, _ = lexical_fts_clauses(
            "Under Section 439, there is no allegation that the accused may abscond."
        )
        self.assertIn('"section 439"', clauses)
        self.assertIn("NEAR(no abscond, 10)", clauses)
        self.assertNotIn('"abscond"', clauses)
        self.assertNotIn("section", tokens)

    def test_negated_fts_does_not_retrieve_positive_only_wording(self) -> None:
        clauses, _, _ = lexical_fts_clauses(
            "There is no allegation that the accused may abscond."
        )
        with sqlite3.connect(":memory:") as db:
            db.execute(
                "CREATE VIRTUAL TABLE passages "
                "USING fts5(text, tokenize='porter unicode61')"
            )
            db.executemany(
                "INSERT INTO passages(rowid, text) VALUES (?, ?)",
                (
                    (1, "There is no allegation that the accused may abscond."),
                    (2, "The accused is likely to abscond and presents a flight risk."),
                ),
            )
            rows = db.execute(
                "SELECT rowid FROM passages WHERE passages MATCH ? ORDER BY rowid",
                (" OR ".join(clauses),),
            ).fetchall()
        self.assertEqual(rows, [(1,)])

    def test_request_rejects_short_query(self) -> None:
        with self.assertRaises(ValueError):
            SearchRequest(query="regular bail", filters=SearchFilters())

    def test_request_accepts_exact_citation_or_case_title(self) -> None:
        citation = SearchRequest(query="2024 INSC 438", filters=SearchFilters())
        title = SearchRequest(query="Ajwar v. Waseem", filters=SearchFilters())
        self.assertEqual(citation.query, "2024 INSC 438")
        self.assertEqual(title.query, "Ajwar v. Waseem")

    def test_rrf_constant_is_documented_default(self) -> None:
        self.assertEqual(RRF_K, 60)
        self.assertEqual(LEGAL_RERANK_WEIGHT, 0.0)
        self.assertEqual(AUTHORITY_RERANK_WEIGHT, 0.0)

    def test_outcome_filter_validation_and_side_mapping(self) -> None:
        filters = SearchFilters(outcome="Petitioner / Appellant side succeeded")
        self.assertEqual(filters.outcome, "Petitioner / Appellant side succeeded")
        with self.assertRaises(ValueError):
            SearchFilters(outcome="Petitioner definitely wins")

    def test_legal_domain_gate(self) -> None:
        self.assertTrue(is_legal_query("Can an accused receive bail under Section 439?"))
        self.assertTrue(is_legal_query("2024 INSC 438"))
        self.assertTrue(is_legal_query("Ajwar v. Waseem"))
        self.assertFalse(is_legal_query("Banana recipes and ocean weather forecasts"))

    def test_lexical_row_does_not_repeat_noisy_whole_judgment_issues(self) -> None:
        text = SemanticEngine._chunk_index_text(
            {
                "title": "A v B",
                "citation": "2025 INSC 1",
                "legalIssues": ["Taxation", "Criminal Law", "Constitutional Law"],
            },
            {
                "evidence": "The two legal heirs seek partition of immovable property.",
                "legalDomains": ["Succession / Inheritance"],
                "statutes": [],
                "sections": [],
                "reliefs": ["Partition / declaration of share"],
                "postures": [],
            },
        ).lower()
        self.assertIn("succession", text)
        self.assertNotIn("taxation", text)
        self.assertNotIn("criminal law", text)


if __name__ == "__main__":
    unittest.main()
