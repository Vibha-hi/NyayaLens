import { BarChart3, BookOpenCheck, ExternalLink, GitBranch, Play } from "lucide-react";
import { CURRENT_EVALUATION } from "@/data/evaluation";
import type { Precedent } from "@/data/precedents";

interface EvaluatorPanelProps {
  isSearching: boolean;
  onRunWalkthrough: () => void;
}

interface WorkedWalkthroughProps {
  query: string;
  result: Precedent;
  extractedSignals: string[];
}

const formatMetric = (value: number | null) =>
  value === null ? "N/A" : `${(value * 100).toFixed(1)}%`;

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function EvidenceExcerpt({ text, phrases }: { text: string; phrases: string[] }) {
  const candidates = Array.from(
    new Set(phrases.map((phrase) => phrase.trim()).filter((phrase) => phrase.length >= 3)),
  )
    .sort((left, right) => right.length - left.length)
    .slice(0, 8);
  if (candidates.length === 0) return <>{text}</>;
  const pattern = new RegExp(`(${candidates.map(escapeRegExp).join("|")})`, "gi");
  const candidateSet = new Set(candidates.map((phrase) => phrase.toLowerCase()));
  return (
    <>
      {text.split(pattern).map((part, index) =>
        candidateSet.has(part.toLowerCase()) ? (
          <mark key={`${part}-${index}`} className="rounded-sm bg-highlight px-0.5 text-foreground">
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </>
  );
}

export function WorkedWalkthrough({ query, result, extractedSignals }: WorkedWalkthroughProps) {
  return (
    <section
      className="mt-4 rounded-xl border border-brand-blue/30 bg-surface p-4 sm:p-5"
      aria-labelledby="worked-walkthrough-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-blue">
            Worked evaluator example · live result
          </p>
          <h3 id="worked-walkthrough-heading" className="mt-1 text-[16px] font-bold text-navy">
            Query → legal signals → ranked precedent → source evidence
          </h3>
        </div>
        <span className="rounded-full border border-teal/30 bg-teal/10 px-2.5 py-1 text-[11px] font-medium text-teal">
          Not a confidence score
        </span>
      </div>

      <ol className="mt-4 grid gap-3 lg:grid-cols-2">
        <li className="rounded-lg border border-border bg-background p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            1 · Anonymized-style facts
          </p>
          <p className="mt-2 text-[12.5px] leading-relaxed text-foreground">{query}</p>
        </li>
        <li className="rounded-lg border border-border bg-background p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            2 · Extracted legal signals
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {extractedSignals.map((signal) => (
              <span
                key={signal}
                className="rounded-md border border-border bg-surface px-2 py-0.5 text-[11.5px] text-navy"
              >
                {signal}
              </span>
            ))}
          </div>
        </li>
        <li className="rounded-lg border border-border bg-background p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            3 · Retrieved result
          </p>
          <p className="mt-2 text-[13px] font-semibold text-navy">
            Rank #{result.rank}: {result.title}
          </p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
            {result.relevanceBasis.slice(0, 4).join(" · ")}
          </p>
        </li>
        <li className="rounded-lg border border-border bg-evidence p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            4 · Highlighted source-linked evidence
          </p>
          <p className="mt-2 text-[12.5px] leading-relaxed text-foreground">
            <EvidenceExcerpt text={result.caseSummary} phrases={result.highlightPhrases} />
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <span>
              {result.evidenceLocator.section} · {result.evidenceLocator.paragraph}
            </span>
            <a
              href={result.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-brand-blue hover:underline"
            >
              Verify source <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          </div>
        </li>
      </ol>
    </section>
  );
}

export function EvaluatorPanel({ isSearching, onRunWalkthrough }: EvaluatorPanelProps) {
  const evaluation = CURRENT_EVALUATION;
  const plainHybrid = evaluation.modes.find((mode) => mode.label === "Plain hybrid RRF");
  const rerankedHybrid = evaluation.modes.find((mode) => mode.label === "Reranked hybrid");
  const measuredAdvantage =
    plainHybrid?.condensedNdcgAt10 !== null &&
    plainHybrid?.condensedNdcgAt10 !== undefined &&
    rerankedHybrid?.condensedNdcgAt10 !== null &&
    rerankedHybrid?.condensedNdcgAt10 !== undefined
      ? rerankedHybrid.condensedNdcgAt10 - plainHybrid.condensedNdcgAt10
      : null;
  return (
    <section className="mx-auto mt-4 max-w-4xl" aria-label="Evaluation and methodology">
      <details className="group rounded-xl border border-border bg-surface shadow-2xs">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-navy marker:content-none">
          <span className="inline-flex items-center gap-2 text-[13px] font-semibold">
            <BarChart3 className="size-4 text-brand-blue" aria-hidden="true" />
            Evaluation, worked example and precedent-validity roadmap
          </span>
          <span className="text-[11px] font-medium text-muted-foreground group-open:hidden">
            Show evaluator evidence
          </span>
          <span className="hidden text-[11px] font-medium text-muted-foreground group-open:inline">
            Hide
          </span>
        </summary>

        <div className="border-t border-border px-4 py-5 sm:px-5">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-background p-4">
              <BookOpenCheck className="size-4 text-brand-blue" aria-hidden="true" />
              <h3 className="mt-2 text-[13px] font-semibold text-navy">Worked walkthrough</h3>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                Runs a fixed anonymized-style query and exposes the complete path from extracted
                signals to highlighted passage and source judgment.
              </p>
              <button
                type="button"
                onClick={onRunWalkthrough}
                disabled={isSearching}
                className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-navy px-3 py-1.5 text-[12px] font-medium text-primary-foreground hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Play className="size-3.5" aria-hidden="true" />
                {isSearching ? "Running…" : "Run evaluator example"}
              </button>
            </div>

            <div className="rounded-lg border border-border bg-background p-4">
              <BarChart3 className="size-4 text-brand-blue" aria-hidden="true" />
              <h3 className="mt-2 text-[13px] font-semibold text-navy">Measured retrieval</h3>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                Current pilot: {evaluation.queries} versioned regression queries and{" "}
                {evaluation.explicitlyJudged} explicit query–judgment labels. The table below
                compares dense, lexical, plain RRF and the production reranker.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background p-4">
              <GitBranch className="size-4 text-brand-blue" aria-hidden="true" />
              <h3 className="mt-2 text-[13px] font-semibold text-navy">Validity: honest scope</h3>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                The current graph maps named citations. It does not claim that a precedent is valid,
                followed or overruled. Negative-treatment detection remains a labelled roadmap until
                its edges are source-linked and legally reviewed.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-border">
            {(() => {
              const modes = evaluation.modes;
              // Compute best (highest) per numeric metric column (lower is better for latency)
              const bestNdcg = Math.max(...modes.map((m) => m.condensedNdcgAt10 ?? -1));
              const bestP5 = Math.max(...modes.map((m) => m.judgedPrecisionAt5 ?? -1));
              const bestCov = Math.max(...modes.map((m) => m.judgedCoverageAt5 ?? -1));
              const bestRecall = Math.max(...modes.map((m) => m.knownRelevantRecallAt10 ?? -1));
              const bestMrr = Math.max(...modes.map((m) => m.knownRelevantMrrAt10 ?? -1));
              const bestLatency = Math.min(...modes.map((m) => m.p95LatencyMs));

              const MetricCell = ({
                value,
                isBest,
                isLatency,
              }: {
                value: number | null;
                isBest: boolean;
                isLatency?: boolean;
              }) => {
                const display = isLatency
                  ? value !== null
                    ? `${(value as number).toFixed(0)} ms`
                    : "N/A"
                  : formatMetric(value);
                return (
                  <td className="px-2 py-2 text-right font-mono text-[11px]">
                    {isBest ? (
                      <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-800 ring-1 ring-emerald-200 text-[10.5px]">
                        {display}
                        <span className="text-[8px] font-bold text-emerald-600">▲</span>
                      </span>
                    ) : (
                      <span className="text-foreground/70">{display}</span>
                    )}
                  </td>
                );
              };

              return (
                <table className="w-full border-collapse text-left text-[11px]">
                  <caption className="border-b border-border bg-muted/40 px-3 py-2.5 text-left text-[12px] font-semibold text-navy">
                    Frozen offline evaluation · {evaluation.corpusVersion || "report generating"} ·{" "}
                    {evaluation.evaluationSet || "versioned query set"}
                  </caption>
                  <thead className="bg-muted/25 text-muted-foreground text-[10px] uppercase tracking-wide">
                    <tr>
                      <th className="px-2 py-2 font-semibold text-left w-[22%]">System</th>
                      <th className="px-2 py-2 font-semibold text-right w-[13%]">nDCG@10</th>
                      <th className="px-2 py-2 font-semibold text-right w-[11%]">P@5</th>
                      <th className="px-2 py-2 font-semibold text-right w-[12%]">Cov@5</th>
                      <th className="px-2 py-2 font-semibold text-right w-[13%]">Recall@10</th>
                      <th className="px-2 py-2 font-semibold text-right w-[12%]">MRR@10</th>
                      <th className="px-2 py-2 font-semibold text-right w-[12%]">p95 lat.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modes.map((mode) => (
                      <tr
                        key={mode.label}
                        className={
                          mode.label === "Plain hybrid RRF"
                            ? "border-t border-border bg-brand-blue/5"
                            : "border-t border-border"
                        }
                      >
                        <th className="px-2 py-2 font-semibold text-navy text-left text-[11px]">
                          {mode.label}
                          {mode.label === "Plain hybrid RRF" && (
                            <span className="ml-1 rounded bg-navy px-1 py-0.5 text-[8px] font-bold text-saffron uppercase tracking-wide">
                              prod
                            </span>
                          )}
                        </th>
                        <MetricCell value={mode.condensedNdcgAt10} isBest={mode.condensedNdcgAt10 === bestNdcg} />
                        <MetricCell value={mode.judgedPrecisionAt5} isBest={mode.judgedPrecisionAt5 === bestP5} />
                        <MetricCell value={mode.judgedCoverageAt5} isBest={mode.judgedCoverageAt5 === bestCov} />
                        <MetricCell value={mode.knownRelevantRecallAt10} isBest={mode.knownRelevantRecallAt10 === bestRecall} />
                        <MetricCell value={mode.knownRelevantMrrAt10} isBest={mode.knownRelevantMrrAt10 === bestMrr} />
                        <MetricCell value={mode.p95LatencyMs} isBest={mode.p95LatencyMs === bestLatency} isLatency />
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}
          </div>


          {plainHybrid && rerankedHybrid && measuredAdvantage !== null && (
            <div
              className={
                "mt-3 rounded-md border px-3 py-2 text-[11.5px] leading-relaxed " +
                (measuredAdvantage >= 0
                  ? "border-teal/30 bg-teal/5 text-navy"
                  : "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100")
              }
            >
              <strong>Pilot finding:</strong>{" "}
              {measuredAdvantage >= 0
                ? "the reranked hybrid is " +
                  (measuredAdvantage * 100).toFixed(1) +
                  " percentage points above plain RRF on condensed nDCG@10."
                : "the reranked hybrid is " +
                  Math.abs(measuredAdvantage * 100).toFixed(1) +
                  " percentage points below plain RRF on condensed nDCG@10. No advantage is claimed; the reranker must be tuned and independently re-reviewed."}{" "}
              Source-link and evidence-locator coverage for the displayed reranked run are{" "}
              {formatMetric(rerankedHybrid.sourceLinkCoverageAt10)} and{" "}
              {formatMetric(rerankedHybrid.evidenceLocatorCoverageAt10)}, respectively.
            </div>
          )}

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-background p-4">
              <h3 className="text-[13px] font-semibold text-navy">How to state these metrics</h3>
              <ul className="mt-2 space-y-2 text-[11.5px] leading-relaxed text-muted-foreground">
                <li>
                  <strong className="text-navy">Primary pilot metric:</strong> condensed nDCG@10
                  rewards placing higher-graded reviewed precedents near the top, after removing
                  unjudged results.
                </li>
                <li>
                  <strong className="text-navy">Judged Precision@5:</strong> relevant results among
                  explicitly judged top-five results; always read it with judged coverage.
                </li>
                <li>
                  <strong className="text-navy">Known recall/MRR:</strong> whether checked-in known
                  positives are retrieved, and how early the first appears.
                </li>
                <li>
                  These are incomplete-label engineering diagnostics—not exhaustive Precision@5,
                  standard nDCG, a per-case confidence score or proof of legal accuracy.
                </li>
              </ul>
              <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                Before an institutional claim: expand to 30–50 independently lawyer-reviewed queries
                across domains, courts, explicit negatives and contradiction cases.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background p-4">
              <h3 className="text-[13px] font-semibold text-navy">
                How precedent-validity detection will be built
              </h3>
              <ol className="mt-2 list-decimal space-y-2 pl-4 text-[11.5px] leading-relaxed text-muted-foreground">
                <li>
                  Version official Supreme Court and High Court judgment texts as the primary
                  corpus; retain supplied PDFs and Indian Kanoon identifiers/links as traceable
                  resolution and verification pointers.
                </li>
                <li>
                  Resolve every cited case by neutral/reported citation and normalized case title;
                  store the citing paragraph, court, date and bench on each directed edge.
                </li>
                <li>
                  Detect treatment language—followed, applied, distinguished, doubted, referred to a
                  larger bench or overruled—inside the citing judgment, never from an edge alone.
                </li>
                <li>
                  Apply chronology, court hierarchy and bench-strength rules, then require legal
                  review for every negative-treatment warning. A licensed citator can be added if
                  the deploying institution provides access.
                </li>
              </ol>
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                Planned UI wording: “Possible negative treatment—verify the later judgment.” The
                system will never show an automatic “valid precedent” checkmark because absence of a
                detected warning does not prove validity.
              </p>
            </div>
          </div>

          {evaluation.gitRevision && (
            <p className="mt-3 text-[10.5px] text-muted-foreground">
              Reproducibility: report generated{" "}
              {new Date(evaluation.generatedAtUtc).toLocaleString()} · engine revision{" "}
              {evaluation.gitRevision.slice(0, 8)} · labels {evaluation.knownRelevant} known
              relevant / {evaluation.explicitNegatives} explicit negative.
            </p>
          )}
        </div>
      </details>
    </section>
  );
}
