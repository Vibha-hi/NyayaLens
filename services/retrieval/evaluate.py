"""Run a small, versioned retrieval evaluation over dense, lexical and hybrid ranks."""

from __future__ import annotations

import json
import math
from pathlib import Path

from app.engine import SemanticEngine
from app.models import SearchFilters


GOLDEN_PATH = Path(__file__).resolve().parent / "evaluation" / "golden_queries.json"
IMPORTED_GOLDEN_PATH = Path(__file__).resolve().parent / "evaluation" / "import_regression_queries.json"


def unique_case_ids(engine: SemanticEngine, chunk_ids: list[str]) -> list[str]:
    case_ids: list[str] = []
    for chunk_id in chunk_ids:
        case_id = engine._chunks[chunk_id]["case_id"]
        if case_id not in case_ids:
            case_ids.append(case_id)
    return case_ids


def reciprocal_rank(ranked: list[str], relevant: set[str], cutoff: int = 10) -> float:
    for rank, case_id in enumerate(ranked[:cutoff], start=1):
        if case_id in relevant:
            return 1.0 / rank
    return 0.0


def recall_at(ranked: list[str], relevant: set[str], cutoff: int = 10) -> float:
    if not relevant:
        return 0.0
    return len(set(ranked[:cutoff]) & relevant) / len(relevant)


def precision_at(ranked: list[str], relevant: set[str], cutoff: int = 5) -> float:
    """Share of the first k retrieved cases that were marked relevant by reviewers."""
    if cutoff <= 0:
        return 0.0
    return len(set(ranked[:cutoff]) & relevant) / cutoff


def ndcg_at(ranked: list[str], relevance: dict[str, int], cutoff: int = 10) -> float:
    def dcg(grades: list[int]) -> float:
        return sum((2**grade - 1) / math.log2(rank + 1) for rank, grade in enumerate(grades, start=1))

    actual = dcg([relevance.get(case_id, 0) for case_id in ranked[:cutoff]])
    ideal = dcg(sorted(relevance.values(), reverse=True)[:cutoff])
    return actual / ideal if ideal else 0.0


def main() -> None:
    engine = SemanticEngine()
    evaluation_path = IMPORTED_GOLDEN_PATH if engine.corpus_version.startswith("import-") else GOLDEN_PATH
    golden = json.loads(evaluation_path.read_text(encoding="utf-8"))
    filters = SearchFilters()
    summary: dict[str, dict[str, float]] = {}

    for mode in ("dense", "lexical", "hybrid"):
        metrics = {"precision@5": [], "mrr@10": [], "recall@10": [], "ndcg@10": []}
        for item in golden:
            if mode == "dense":
                chunks = [result.chunk_id for result in engine._dense(item["query"], filters)]
                ranked = unique_case_ids(engine, chunks)
            elif mode == "lexical":
                chunks = [result.chunk_id for result in engine._lexical(item["query"], filters)]
                ranked = unique_case_ids(engine, chunks)
            else:
                ranked = [result.id for result in engine.search(item["query"], filters, 10).results]

            relevance = item["relevance"]
            relevant = set(relevance)
            metrics["precision@5"].append(precision_at(ranked, relevant))
            metrics["mrr@10"].append(reciprocal_rank(ranked, relevant))
            metrics["recall@10"].append(recall_at(ranked, relevant))
            metrics["ndcg@10"].append(ndcg_at(ranked, relevance))

        summary[mode] = {
            name: round(sum(values) / len(values), 4) for name, values in metrics.items()
        }

    print(
        json.dumps(
            {
                "corpusVersion": engine.corpus_version,
                "evaluationSet": evaluation_path.name,
                "queries": len(golden),
                "metrics": summary,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
