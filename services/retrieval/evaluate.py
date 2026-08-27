"""Compare dense, lexical, plain-RRF and reranked retrieval on versioned qrels.

The checked-in qrels are intentionally incomplete: a judgment absent from a
query's labels is *unjudged*, not irrelevant. Metrics in this module therefore
either use known positives (recall/MRR), operate on a condensed list containing
only judged results (precision/nDCG), or report label coverage alongside the
score. This prevents a sparse review set from being presented as exhaustive
legal relevance ground truth.
"""

from __future__ import annotations

import argparse
import json
import math
import subprocess
import time
from collections import defaultdict
from datetime import datetime, timezone
from itertools import combinations
from pathlib import Path
from typing import Any

from app.engine import (
    INDEX_SCHEMA_VERSION,
    LEXICAL_SELECTOR_VERSION,
    RRF_K,
    VECTOR_SELECTOR_VERSION,
    SemanticEngine,
)
from app.models import SearchFilters


GOLDEN_PATH = Path(__file__).resolve().parent / "evaluation" / "golden_queries.json"
IMPORTED_GOLDEN_PATH = Path(__file__).resolve().parent / "evaluation" / "import_regression_queries.json"
PROJECT_ROOT = Path(__file__).resolve().parents[2]


def deduplicate(ranked: list[str]) -> list[str]:
    """Preserve rank order while ensuring a judgment is evaluated only once."""
    return list(dict.fromkeys(ranked))


def rrf_fuse_case_rankings(
    *rankings: list[str], k: int = RRF_K
) -> list[str]:
    """Fuse case-level rankings without legal-intent or authority reranking."""

    if k <= 0:
        raise ValueError("RRF k must be positive")
    scores: dict[str, float] = defaultdict(float)
    for ranking in rankings:
        for rank, case_id in enumerate(deduplicate(ranking), start=1):
            scores[case_id] += 1.0 / (k + rank)
    return sorted(scores, key=lambda case_id: (-scores[case_id], case_id))


def percentile(values: list[float], probability: float) -> float | None:
    """Return a linearly interpolated percentile for a small timing sample."""

    if not values:
        return None
    if not 0 <= probability <= 1:
        raise ValueError("Percentile probability must be between zero and one")
    ordered = sorted(values)
    position = (len(ordered) - 1) * probability
    lower = math.floor(position)
    upper = math.ceil(position)
    if lower == upper:
        return round(ordered[lower], 3)
    weight = position - lower
    return round(ordered[lower] * (1 - weight) + ordered[upper] * weight, 3)


def reciprocal_rank(ranked: list[str], relevant: set[str], cutoff: int = 10) -> float | None:
    if not relevant:
        return None
    for rank, case_id in enumerate(deduplicate(ranked)[:cutoff], start=1):
        if case_id in relevant:
            return 1.0 / rank
    return 0.0


def recall_at(ranked: list[str], relevant: set[str], cutoff: int = 10) -> float | None:
    """Recall of explicitly known relevant judgments, not recall of all law."""
    if not relevant:
        return None
    return len(set(deduplicate(ranked)[:cutoff]) & relevant) / len(relevant)


def judged_precision_at(
    ranked: list[str], relevant: set[str], judged: set[str], cutoff: int = 5
) -> float | None:
    """Precision among retrieved judgments that have an explicit human label.

    Returning ``None`` when no top-k result is judged is important. Returning
    zero in that situation would incorrectly convert missing review work into a
    negative relevance decision.
    """
    if cutoff <= 0:
        return None
    judged_results = [case_id for case_id in deduplicate(ranked)[:cutoff] if case_id in judged]
    if not judged_results:
        return None
    return sum(case_id in relevant for case_id in judged_results) / len(judged_results)


def judged_coverage_at(ranked: list[str], judged: set[str], cutoff: int = 5) -> float | None:
    """Fraction of the returned top-k that has any explicit relevance label."""
    returned = deduplicate(ranked)[:cutoff]
    if not returned:
        return None
    return sum(case_id in judged for case_id in returned) / len(returned)


def condensed_ndcg_at(
    ranked: list[str], relevance: dict[str, int], judged: set[str], cutoff: int = 10
) -> float | None:
    """nDCG after removing unjudged results instead of grading them as zero.

    Explicit negatives remain in the condensed list with grade zero. This is a
    useful incomplete-qrels diagnostic, but its interpretation still depends on
    the reported judged coverage.
    """

    def dcg(grades: list[int]) -> float:
        return sum((2**grade - 1) / math.log2(rank + 1) for rank, grade in enumerate(grades, start=1))

    if not judged or not any(grade > 0 for grade in relevance.values()):
        return None
    condensed = [case_id for case_id in deduplicate(ranked) if case_id in judged][:cutoff]
    actual = dcg([relevance.get(case_id, 0) for case_id in condensed])
    ideal = dcg(sorted((relevance.get(case_id, 0) for case_id in judged), reverse=True)[:cutoff])
    return actual / ideal if ideal else None


def graded_preference_pairs(relevance: dict[str, int]) -> list[tuple[str, str]]:
    """Return (preferred, less-preferred) pairs justified by unequal qrel grades."""
    pairs: list[tuple[str, str]] = []
    for first, second in combinations(relevance, 2):
        first_grade = relevance[first]
        second_grade = relevance[second]
        if first_grade > second_grade:
            pairs.append((first, second))
        elif second_grade > first_grade:
            pairs.append((second, first))
    return pairs


def pairwise_preference_at(
    ranked: list[str], relevance: dict[str, int], cutoff: int = 10
) -> tuple[float | None, float | None]:
    """Return preference accuracy and pair coverage for graded judgments.

    Accuracy is calculated only when both members of a justified preference
    pair occur in the top-k. Coverage exposes how often that comparison was
    actually possible, so an absent lower-grade judgment cannot be mistaken for
    a successful ordering decision.
    """
    pairs = graded_preference_pairs(relevance)
    if not pairs:
        return None, None
    positions = {case_id: rank for rank, case_id in enumerate(deduplicate(ranked)[:cutoff])}
    observed = [(better, worse) for better, worse in pairs if better in positions and worse in positions]
    coverage = len(observed) / len(pairs)
    if not observed:
        return None, coverage
    correct = sum(positions[better] < positions[worse] for better, worse in observed)
    return correct / len(observed), coverage


def explicit_contradiction_rate_at(
    ranked: list[str], contradictory: set[str], judged: set[str], cutoff: int = 5
) -> float | None:
    """Rate of explicitly contradiction-labelled results among judged top-k.

    The caller must use this only for queries containing a ``contradictory``
    annotation. A missing annotation means "not reviewed", not "zero".
    """
    judged_results = [case_id for case_id in deduplicate(ranked)[:cutoff] if case_id in judged]
    if not judged_results:
        return None
    return sum(case_id in contradictory for case_id in judged_results) / len(judged_results)


def _normalise_labels(item: dict[str, Any]) -> dict[str, Any]:
    relevance_raw = item.get("relevance")
    if not isinstance(relevance_raw, dict) or not relevance_raw:
        raise ValueError(f"{item.get('id', '<unknown>')}: relevance must be a non-empty object")

    relevance: dict[str, int] = {}
    for case_id, raw_grade in relevance_raw.items():
        if (
            not isinstance(case_id, str)
            or not isinstance(raw_grade, int)
            or isinstance(raw_grade, bool)
            or raw_grade < 0
            or raw_grade > 3
        ):
            raise ValueError(
                f"{item.get('id', '<unknown>')}: relevance grades must be integers from 0 to 3"
            )
        relevance[case_id] = raw_grade

    non_relevant_raw = item.get("non_relevant", [])
    contradictory_raw = item.get("contradictory", [])
    if not isinstance(non_relevant_raw, list) or not isinstance(contradictory_raw, list):
        raise ValueError(f"{item.get('id', '<unknown>')}: judgment labels must be arrays")
    non_relevant = set(non_relevant_raw)
    contradictory = set(contradictory_raw)
    if not all(isinstance(case_id, str) for case_id in non_relevant | contradictory):
        raise ValueError(f"{item.get('id', '<unknown>')}: judgment label lists must contain strings")

    relevant = {case_id for case_id, grade in relevance.items() if grade > 0}
    explicitly_negative = {case_id for case_id, grade in relevance.items() if grade == 0} | non_relevant
    conflicts = relevant & (explicitly_negative | contradictory)
    if conflicts:
        raise ValueError(
            f"{item.get('id', '<unknown>')}: conflicting positive and negative labels for {sorted(conflicts)}"
        )

    # A contradiction is necessarily a reviewed, non-relevant result for this
    # query, even if the reviewer did not repeat it in ``non_relevant``.
    explicitly_negative |= contradictory
    relevance = {**relevance, **{case_id: 0 for case_id in explicitly_negative}}
    judged = set(relevance)
    return {
        "relevance": relevance,
        "relevant": relevant,
        "judged": judged,
        "contradictory": contradictory,
        "contradiction_reviewed": "contradictory" in item,
    }


def evaluate_ranking(ranked: list[str], item: dict[str, Any]) -> dict[str, float | int | None]:
    ranked = deduplicate(ranked)
    labels = _normalise_labels(item)
    preference_accuracy, preference_coverage = pairwise_preference_at(ranked, labels["relevance"])
    contradiction_rate = None
    contradiction_hit = None
    if labels["contradiction_reviewed"]:
        contradiction_rate = explicit_contradiction_rate_at(
            ranked, labels["contradictory"], labels["judged"]
        )
        contradiction_hit = float(bool(set(ranked[:5]) & labels["contradictory"]))

    return {
        "judgedPrecision@5": judged_precision_at(ranked, labels["relevant"], labels["judged"]),
        "judgedCoverage@5": judged_coverage_at(ranked, labels["judged"]),
        "knownRelevantMrr@10": reciprocal_rank(ranked, labels["relevant"]),
        "knownRelevantRecall@10": recall_at(ranked, labels["relevant"]),
        "condensedNdcg@10": condensed_ndcg_at(
            ranked, labels["relevance"], labels["judged"]
        ),
        "pairwisePreferenceAccuracy@10": preference_accuracy,
        "pairwisePreferenceCoverage@10": preference_coverage,
        "explicitContradictionRateAmongJudged@5": contradiction_rate,
        "explicitContradictionQueryHit@5": contradiction_hit,
        "judgedResults@5": len(set(ranked[:5]) & labels["judged"]),
        "unjudgedResults@5": len([case_id for case_id in ranked[:5] if case_id not in labels["judged"]]),
    }


def _mean(values: list[float | int | None]) -> tuple[float | None, int]:
    observed = [float(value) for value in values if value is not None]
    return (round(sum(observed) / len(observed), 4), len(observed)) if observed else (None, 0)


def _load_golden(path: Path) -> list[dict[str, Any]]:
    golden = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(golden, list) or not golden:
        raise ValueError(f"{path.name}: evaluation set must be a non-empty array")
    seen_ids: set[str] = set()
    for item in golden:
        if not isinstance(item, dict) or not isinstance(item.get("id"), str) or not isinstance(item.get("query"), str):
            raise ValueError(f"{path.name}: every query needs string id and query fields")
        if item["id"] in seen_ids:
            raise ValueError(f"{path.name}: duplicate query id {item['id']}")
        seen_ids.add(item["id"])
        _normalise_labels(item)
    return golden


def validate_qrel_case_ids(
    golden: list[dict[str, Any]], active_case_ids: set[str]
) -> None:
    """Fail before scoring when labels target a different corpus snapshot."""

    missing_by_query: dict[str, list[str]] = {}
    for item in golden:
        judged = _normalise_labels(item)["judged"]
        missing = sorted(judged - active_case_ids)
        if missing:
            missing_by_query[item["id"]] = missing
    if missing_by_query:
        details = "; ".join(
            f"{query_id}: {', '.join(case_ids)}"
            for query_id, case_ids in missing_by_query.items()
        )
        raise ValueError(
            "Evaluation qrels reference judgments absent from the active corpus: "
            + details
        )


def coverage_at(
    ranked: list[str], available_case_ids: set[str], cutoff: int = 10
) -> float | None:
    returned = deduplicate(ranked)[:cutoff]
    if not returned:
        return None
    return sum(case_id in available_case_ids for case_id in returned) / len(returned)


def _branch_case_ranking(
    engine: SemanticEngine, ranked_chunks: list[Any]
) -> tuple[list[str], dict[str, str]]:
    ranked: list[str] = []
    chunk_by_case: dict[str, str] = {}
    for result in ranked_chunks:
        case_id = engine._chunks[result.chunk_id]["case_id"]
        if case_id not in chunk_by_case:
            ranked.append(case_id)
            chunk_by_case[case_id] = result.chunk_id
    return ranked, chunk_by_case


def _source_available_case_ids(
    engine: SemanticEngine, ranked: list[str]
) -> set[str]:
    available: set[str] = set()
    for case_id in deduplicate(ranked):
        case = engine._cases.get(case_id, {})
        if str(case.get("sourceUrl", "")).strip() or engine.document_path(case_id) is not None:
            available.add(case_id)
    return available


def _chunk_locator_available_case_ids(
    engine: SemanticEngine, chunk_by_case: dict[str, str]
) -> set[str]:
    available: set[str] = set()
    for case_id, chunk_id in chunk_by_case.items():
        chunk = engine._chunks[chunk_id]
        if (
            str(chunk.get("evidence", "")).strip()
            and str(chunk.get("section", "")).strip()
            and str(chunk.get("paragraph", "")).strip()
        ):
            available.add(case_id)
    return available


def _git_revision() -> str:
    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=PROJECT_ROOT,
            check=True,
            capture_output=True,
            text=True,
            timeout=10,
        )
    except (OSError, subprocess.SubprocessError):
        return "unavailable"
    return result.stdout.strip() or "unavailable"


def persist_json_report(report: dict[str, Any], output_path: Path) -> str:
    """Persist the same JSON document that remains available on stdout."""

    rendered = json.dumps(report, indent=2)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(rendered + "\n", encoding="utf-8")
    return rendered


def _label_summary(golden: list[dict[str, Any]]) -> dict[str, int]:
    labels = [_normalise_labels(item) for item in golden]
    return {
        "queries": len(golden),
        "explicitJudgments": sum(len(label["judged"]) for label in labels),
        "knownRelevantJudgments": sum(len(label["relevant"]) for label in labels),
        "explicitNegativeJudgments": sum(
            len(label["judged"] - label["relevant"]) for label in labels
        ),
        "queriesWithExplicitNegatives": sum(
            bool(label["judged"] - label["relevant"]) for label in labels
        ),
        "gradedPreferencePairs": sum(
            len(graded_preference_pairs(label["relevance"])) for label in labels
        ),
        "queriesWithContradictionReview": sum(
            bool(label["contradiction_reviewed"]) for label in labels
        ),
    }


def _limitations(label_summary: dict[str, int]) -> list[str]:
    notes = [
        "Unjudged retrieved judgments are unknown, not assumed irrelevant; judged precision and condensed nDCG must be read with judged coverage.",
        "Known-relevant recall and MRR cover only the checked-in positive labels, not every legally relevant precedent in the corpus.",
        "These incomplete-qrel diagnostics are not exhaustive Precision@K or standard fully judged nDCG@K and must not be presented as legal-accuracy estimates.",
        "Latency percentiles use one pass over this small regression set; they are smoke measurements, not a hardware-controlled performance benchmark.",
        "Source-link and evidence-locator coverage test structural availability, not external-link health or independent legal verification of the cited passage.",
        "This small regression set is not evidence of institutional legal accuracy; production evaluation needs independently reviewed, adjudicated queries across domains and courts.",
    ]
    if label_summary["explicitNegativeJudgments"] == 0:
        notes.append(
            "No explicit negative judgments are labelled, so judged precision cannot measure false positives reliably."
        )
    elif label_summary["queriesWithExplicitNegatives"] < label_summary["queries"]:
        notes.append(
            "Only some queries contain explicit negatives; judged precision has limited false-positive coverage for the remaining queries."
        )
    if label_summary["queriesWithContradictionReview"] == 0:
        notes.append(
            "No query has reviewer-supplied contradiction labels; contradiction metrics are unavailable rather than reported as zero."
        )
    return notes


def run_evaluation(
    engine: SemanticEngine,
    golden: list[dict[str, Any]],
    evaluation_path: Path,
) -> dict[str, Any]:
    validate_qrel_case_ids(golden, set(engine._cases))
    filters = SearchFilters()
    metric_names = [
        "judgedPrecision@5",
        "judgedCoverage@5",
        "knownRelevantMrr@10",
        "knownRelevantRecall@10",
        "condensedNdcg@10",
        "pairwisePreferenceAccuracy@10",
        "pairwisePreferenceCoverage@10",
        "explicitContradictionRateAmongJudged@5",
        "explicitContradictionQueryHit@5",
        "sourceLinkCoverage@10",
        "evidenceLocatorCoverage@10",
    ]
    summary: dict[str, dict[str, Any]] = {}
    diagnostics: dict[str, list[dict[str, Any]]] = {}

    modes = ("dense", "lexical", "hybridRrf", "hybridReranked")
    for mode in modes:
        collected: dict[str, list[float | int | None]] = {name: [] for name in metric_names}
        latencies_ms: list[float] = []
        mode_diagnostics: list[dict[str, Any]] = []
        for item in golden:
            chunk_by_case: dict[str, str] = {}
            result_locator_case_ids: set[str] | None = None
            started = time.perf_counter()
            if mode == "dense":
                ranked_chunks = engine._dense(item["query"], filters)
                ranked, chunk_by_case = _branch_case_ranking(engine, ranked_chunks)
            elif mode == "lexical":
                ranked_chunks = engine._lexical(item["query"], filters)
                ranked, chunk_by_case = _branch_case_ranking(engine, ranked_chunks)
            elif mode == "hybridRrf":
                dense_chunks = engine._dense(item["query"], filters)
                lexical_chunks = engine._lexical(item["query"], filters)
                dense_ranked, dense_chunk_by_case = _branch_case_ranking(engine, dense_chunks)
                lexical_ranked, lexical_chunk_by_case = _branch_case_ranking(
                    engine, lexical_chunks
                )
                ranked = rrf_fuse_case_rankings(
                    dense_ranked, lexical_ranked, k=RRF_K
                )
                chunk_by_case = {
                    case_id: dense_chunk_by_case.get(case_id)
                    or lexical_chunk_by_case[case_id]
                    for case_id in ranked
                }
            else:
                response = engine.search(item["query"], filters, 10)
                ranked = [result.id for result in response.results]
                result_locator_case_ids = {
                    result.id
                    for result in response.results
                    if result.matchedEvidence.strip()
                    and result.evidenceLocator.section.strip()
                    and result.evidenceLocator.paragraph.strip()
                }
            latency_ms = (time.perf_counter() - started) * 1_000
            latencies_ms.append(latency_ms)

            scores = evaluate_ranking(ranked, item)
            source_coverage = coverage_at(
                ranked, _source_available_case_ids(engine, ranked)
            )
            locator_case_ids = (
                result_locator_case_ids
                if result_locator_case_ids is not None
                else _chunk_locator_available_case_ids(engine, chunk_by_case)
            )
            evidence_coverage = coverage_at(ranked, locator_case_ids)
            query_metrics = {
                **scores,
                "sourceLinkCoverage@10": source_coverage,
                "evidenceLocatorCoverage@10": evidence_coverage,
            }
            for name in metric_names:
                collected[name].append(query_metrics[name])
            labels = _normalise_labels(item)
            labels_at_top = []
            for case_id in ranked[:5]:
                if case_id in labels["contradictory"]:
                    status = "contradictory"
                elif case_id in labels["relevant"]:
                    status = f"relevant:{labels['relevance'][case_id]}"
                elif case_id in labels["judged"]:
                    status = "non_relevant"
                else:
                    status = "unjudged"
                labels_at_top.append({"caseId": case_id, "label": status})
            mode_diagnostics.append(
                {
                    "id": item["id"],
                    "top10": ranked[:10],
                    "labelsAtTop5": labels_at_top,
                    "judgedResults@5": scores["judgedResults@5"],
                    "unjudgedResults@5": scores["unjudgedResults@5"],
                    "latencyMs": round(latency_ms, 3),
                    "metrics": {name: query_metrics[name] for name in metric_names},
                }
            )

        mode_summary: dict[str, Any] = {}
        observations: dict[str, int] = {}
        for name, values in collected.items():
            value, count = _mean(values)
            mode_summary[name] = value
            observations[name] = count
        mode_summary["metricObservations"] = observations
        mode_summary["latencyMs"] = {
            "p50": percentile(latencies_ms, 0.50),
            "p95": percentile(latencies_ms, 0.95),
            "observations": len(latencies_ms),
        }
        summary[mode] = mode_summary
        diagnostics[mode] = mode_diagnostics

    label_summary = _label_summary(golden)
    return {
        "generatedAtUtc": datetime.now(timezone.utc).isoformat(),
        "gitRevision": _git_revision(),
        "corpusVersion": engine.corpus_version,
        "modelVersion": engine.model_version,
        "indexVersion": {
            "schema": INDEX_SCHEMA_VERSION,
            "vectorSelector": VECTOR_SELECTOR_VERSION,
            "lexicalSelector": LEXICAL_SELECTOR_VERSION,
            "rrfK": RRF_K,
        },
        "evaluationSet": evaluation_path.name,
        "systems": {
            "dense": "Two-vector case-level dense branch",
            "lexical": "Role-aware case-level SQLite FTS5 branch",
            "hybridRrf": "Plain case-level reciprocal-rank fusion of dense and lexical branches",
            "hybridReranked": "Production hybrid with legal-context, contradiction and authority reranking",
        },
        "labelSummary": label_summary,
        "metrics": summary,
        "topResultDiagnostics": diagnostics,
        "limitations": _limitations(label_summary),
    }


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(
        description="Evaluate dense, lexical, plain-RRF and reranked retrieval systems."
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="Optionally persist the JSON report to this path; JSON is still printed to stdout.",
    )
    args = parser.parse_args(argv)

    engine = SemanticEngine()
    evaluation_path = (
        IMPORTED_GOLDEN_PATH
        if engine.corpus_version.startswith("import-")
        else GOLDEN_PATH
    )
    golden = _load_golden(evaluation_path)
    report = run_evaluation(engine, golden, evaluation_path)
    if args.output is not None:
        rendered = persist_json_report(report, args.output.resolve())
    else:
        rendered = json.dumps(report, indent=2)
    print(rendered)


if __name__ == "__main__":
    main()
