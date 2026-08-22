import { ChevronDown, ExternalLink } from "lucide-react";
import type { Precedent } from "@/data/precedents";

function HighlightedEvidence({ text, phrases }: { text: string; phrases: string[] }) {
  const escaped = phrases.map((phrase) => phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = escaped.length > 0 ? new RegExp(`(${escaped.join("|")})`, "gi") : null;
  const parts = pattern ? text.split(pattern) : [text];

  return (
    <p className="text-[13.5px] leading-relaxed text-foreground">
      {parts.map((part, index) =>
        pattern && phrases.some((phrase) => phrase.toLowerCase() === part.toLowerCase()) ? (
          <mark key={index} className="bg-brand-blue/12 px-0.5 font-medium text-navy">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </p>
  );
}

interface PrecedentItemProps {
  precedent: Precedent;
  expanded: boolean;
  onToggle: () => void;
}

export function PrecedentItem({ precedent, expanded, onToggle }: PrecedentItemProps) {
  const panelId = `why-${precedent.id}`;

  return (
    <article className="py-7">
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="mt-0.5 min-w-6 font-serif text-[15px] font-semibold text-muted-foreground tabular-nums"
        >
          {precedent.rank}.
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h3 className="text-[17px] leading-snug font-semibold text-navy">
              <span className="sr-only">Result {precedent.rank}: </span>
              {precedent.title}
            </h3>
          </div>

          <dl className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted-foreground">
            <div className="flex gap-1">
              <dt className="sr-only">Court</dt>
              <dd>{precedent.court}</dd>
            </div>
            <span aria-hidden="true">·</span>
            <div className="flex gap-1">
              <dt className="sr-only">Year</dt>
              <dd>{precedent.year}</dd>
            </div>
            <span aria-hidden="true">·</span>
            <div className="flex gap-1">
              <dt className="sr-only">Citation</dt>
              <dd className="font-mono text-[12px]">{precedent.citation}</dd>
            </div>
            <span aria-hidden="true">·</span>
            <div className="flex gap-1.5">
              <dt className="text-muted-foreground">Hybrid rank</dt>
              <dd className="font-medium text-teal">#{precedent.rank}</dd>
            </div>
          </dl>

          <p className="mt-2 text-[13px] text-muted-foreground">
            <span className="text-navy">Procedural posture:</span> {precedent.posture}
          </p>

          <ul className="mt-3 flex flex-wrap gap-2">
            {precedent.legalIssues.map((issue) => (
              <li
                key={issue}
                className="rounded-md border border-border px-2 py-0.5 text-[11.5px] text-navy"
              >
                {issue}
              </li>
            ))}
          </ul>

          <div className="mt-4 rounded-r-md border-l-2 border-brand-blue bg-evidence px-3.5 py-3">
            <p className="mb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              Matched evidence
            </p>
            <HighlightedEvidence
              text={precedent.matchedEvidence}
              phrases={precedent.highlightPhrases}
            />
            {precedent.evidenceLocator && (
              <p className="mt-2 text-[11.5px] text-muted-foreground">
                Source locator: {precedent.evidenceLocator.section} ·{" "}
                {precedent.evidenceLocator.paragraph}
              </p>
            )}
          </div>

          <p className="mt-3 text-[13px] text-foreground">
            <span className="font-medium text-navy">Verification status:</span> {precedent.outcome}
          </p>

          {(precedent.denseRank || precedent.lexicalRank) && (
            <p className="mt-2 text-[11.5px] text-muted-foreground">
              Retrieval trace: dense rank {precedent.denseRank ?? "not in candidate set"} · lexical
              rank {precedent.lexicalRank ?? "not in candidate set"}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={expanded}
              aria-controls={panelId}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[12.5px] font-medium text-navy hover:bg-accent"
            >
              <ChevronDown
                className={`size-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
              Why it matched
            </button>

            <a
              href={precedent.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[12.5px] font-medium text-navy transition-colors hover:bg-accent hover:text-brand-blue"
            >
              <ExternalLink className="size-3.5" aria-hidden="true" />
              Verify original judgment
            </a>
          </div>

          <div
            id={panelId}
            hidden={!expanded}
            className="mt-4 rounded-md border border-border bg-surface p-4"
          >
            <dl className="space-y-3 text-[13px]">
              <div>
                <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Shared facts
                </dt>
                <dd className="mt-1 text-foreground">{precedent.explanation.sharedFacts}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Shared legal issues
                </dt>
                <dd className="mt-1 text-foreground">{precedent.explanation.sharedLegalIssues}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Procedural posture
                </dt>
                <dd className="mt-1 text-foreground">{precedent.explanation.proceduralPosture}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Matching legal terms
                </dt>
                <dd className="mt-1.5 flex flex-wrap gap-2">
                  {precedent.explanation.matchingTerms.map((term) => (
                    <span
                      key={term}
                      className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11.5px] text-navy"
                    >
                      {term}
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Relation
                </dt>
                <dd className="mt-1 text-foreground">{precedent.explanation.relation}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Match points
                </dt>
                <dd>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-foreground">
                    {precedent.whyItMatched.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </article>
  );
}
