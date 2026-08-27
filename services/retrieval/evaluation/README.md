# Retrieval evaluation labels

These files are small regression sets, not exhaustive relevance judgments. A
case absent from a query is **unjudged** and must not be interpreted as legally
irrelevant.

Each query has the following fields:

- `id`: stable query identifier;
- `query`: the natural-language facts or legal issue;
- `relevance`: source-inspected engineering regression case IDs with integer
  grades (`3` strongly relevant, `2` relevant, `1` marginally relevant, and
  `0` explicitly not relevant); these labels are not represented as independent
  lawyer review;
- `non_relevant` (optional): additional reviewer-confirmed negatives; and
- `contradictory` (optional): reviewer-confirmed results that contradict a
  material fact or legal constraint in this particular query and should not be
  returned as a match.

Do not add `non_relevant` or `contradictory` entries merely because a case was
not returned, looks unfamiliar, or was flagged by the same ranking heuristic
being evaluated. Labels should come from review of the source judgment. An
empty `contradictory` array means the query was reviewed and no known
contradictory judgment was labelled; an absent field means contradiction review
has not been performed.

`evaluate.py` compares four separately named systems: dense-only, lexical-only,
plain case-level hybrid RRF, and the production reranked hybrid. It reports
judged-only precision with judged coverage, known-positive MRR/recall,
condensed nDCG, pairwise preference accuracy, one-pass p50/p95 latency, and
structural source-link/evidence-locator coverage. Contradiction metrics remain
`null` until the active set contains explicit contradiction review.

Because the qrels are incomplete, these are **not** exhaustive Precision@K or
standard fully judged nDCG@K measurements. Never quote judged precision without
its coverage and observation count. The latency values are regression smoke
measurements rather than a controlled hardware benchmark, and structural link
coverage does not prove that an external page is currently reachable.

The report includes corpus, model, index-selector and Git versions. Qrel case
IDs are validated against the active corpus before any score is calculated.
JSON remains on stdout and can optionally be persisted:

```powershell
services/retrieval/.venv/Scripts/python.exe services/retrieval/evaluate.py `
  --output services/retrieval/evaluation/latest-report.json
```

Keep generated reports out of commits unless a reviewed, frozen report is being
deliberately versioned. Read every metric together with the emitted label
summary and limitations.
