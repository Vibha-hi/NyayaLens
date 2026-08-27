export interface EvaluationModeMetrics {
  label: string;
  condensedNdcgAt10: number | null;
  judgedPrecisionAt5: number | null;
  judgedCoverageAt5: number | null;
  knownRelevantRecallAt10: number | null;
  knownRelevantMrrAt10: number | null;
  p95LatencyMs: number;
  sourceLinkCoverageAt10: number | null;
  evidenceLocatorCoverageAt10: number | null;
}

export interface EvaluationSnapshot {
  generatedAtUtc: string;
  gitRevision: string;
  corpusVersion: string;
  evaluationSet: string;
  queries: number;
  explicitlyJudged: number;
  knownRelevant: number;
  explicitNegatives: number;
  modes: EvaluationModeMetrics[];
}

// Populated from services/retrieval/evaluation/latest-report.json
// Generated: 2026-08-27T08:19:07Z · corpus: import-2026-08-26-4609-cases
// 6 queries · 14 explicit judgments · 12 known-relevant · 2 explicit negatives
export const CURRENT_EVALUATION: EvaluationSnapshot = {
  generatedAtUtc: "2026-08-27T08:19:07.314327+00:00",
  gitRevision: "7c641f34a7dbcbcce36a2dc726cb815c30444fc6",
  corpusVersion: "import-2026-08-26 · 4,609 cases",
  evaluationSet: "6-query pilot (import_regression_queries.json)",
  queries: 6,
  explicitlyJudged: 14,
  knownRelevant: 12,
  explicitNegatives: 2,
  modes: [
    {
      label: "Dense only",
      condensedNdcgAt10: 0.8276,
      judgedPrecisionAt5: 1.0,
      judgedCoverageAt5: 0.1,
      knownRelevantRecallAt10: 0.4167,
      knownRelevantMrrAt10: 0.4352,
      p95LatencyMs: 73.672,
      sourceLinkCoverageAt10: 1.0,
      evidenceLocatorCoverageAt10: 1.0,
    },
    {
      label: "Lexical only",
      condensedNdcgAt10: 0.8821,
      judgedPrecisionAt5: 0.875,
      judgedCoverageAt5: 0.2,
      knownRelevantRecallAt10: 0.5,
      knownRelevantMrrAt10: 0.5602,
      p95LatencyMs: 396.456,
      sourceLinkCoverageAt10: 1.0,
      evidenceLocatorCoverageAt10: 1.0,
    },
    {
      label: "Plain hybrid RRF",
      condensedNdcgAt10: 0.9379,
      judgedPrecisionAt5: 1.0,
      judgedCoverageAt5: 0.1667,
      knownRelevantRecallAt10: 0.5833,
      knownRelevantMrrAt10: 0.4931,
      p95LatencyMs: 488.199,
      sourceLinkCoverageAt10: 1.0,
      evidenceLocatorCoverageAt10: 1.0,
    },
    {
      label: "Reranked hybrid",
      condensedNdcgAt10: 0.7703,
      judgedPrecisionAt5: 1.0,
      judgedCoverageAt5: 0.1667,
      knownRelevantRecallAt10: 0.5833,
      knownRelevantMrrAt10: 0.4931,
      p95LatencyMs: 1580.128,
      sourceLinkCoverageAt10: 1.0,
      evidenceLocatorCoverageAt10: 1.0,
    },
  ],
};
