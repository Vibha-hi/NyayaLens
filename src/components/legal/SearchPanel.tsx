import { useState } from "react";
import {
  Search,
  RotateCcw,
  CheckCircle,
  FileText,
  HelpCircle,
  Lightbulb,
  Shield,
  Scale,
} from "lucide-react";
import { CATEGORIES, DEFAULT_QUERY, type LegalCategory } from "@/data/precedents";

interface SearchPanelProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  isSearching: boolean;
  selectedCategory?: LegalCategory;
  onSelectCategory?: (category: LegalCategory) => void;
}

const HINTS = [
  "State chronological material facts",
  "Specify applicable sections (e.g. 439 CrPC, 302 IPC, Sec 12 DV)",
  "Indicate investigation status & evidence type",
  "State specific relief or ratio sought",
];

export function SearchPanel({
  query,
  onQueryChange,
  onSearch,
  onClear,
  isSearching,
  selectedCategory,
  onSelectCategory,
}: SearchPanelProps) {
  const isEmpty = query.trim().length === 0;
  const wordCount = query.trim().length === 0 ? 0 : query.trim().split(/\s+/).length;

  const handleApplySample = (sampleQuery: string, catId: LegalCategory) => {
    onQueryChange(sampleQuery);
    if (onSelectCategory) {
      onSelectCategory(catId);
    }
  };

  return (
    <section
      id="search-section"
      aria-labelledby="search-heading"
      className="relative border-b border-border bg-linear-to-b from-surface via-surface to-background pt-8 pb-12 sm:pt-12 sm:pb-16"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        {/* Hero Header Area */}
        <div className="max-w-4xl">
          <h1
            id="search-heading"
            className="text-[32px] leading-tight font-bold text-navy sm:text-[42px] tracking-tight"
          >
            Find Similar Court Precedents & Judgments
          </h1>

          <p className="mt-3.5 text-[16px] leading-relaxed text-muted-foreground max-w-3xl">
            Enter anonymized facts, statutory provisions, or procedural questions. The local engine
            combines <strong className="text-navy font-semibold">dense passage retrieval</strong>{" "}
            with <strong className="text-navy font-semibold">exact legal-term search</strong> over
            the imported Supreme Court and High Court judgment corpus.
          </p>
        </div>

        {/* Search Box Card with Glow & Focus */}
        <form
          className="mt-8 max-w-4xl rounded-2xl border-2 border-border bg-surface p-5 sm:p-7 shadow-lg transition-all focus-within:border-brand-blue focus-within:ring-4 focus-within:ring-brand-blue/15"
          onSubmit={(event) => {
            event.preventDefault();
            if (!isEmpty) onSearch();
          }}
        >
          {/* Label + Sample Trigger */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <label
              htmlFor="case-description"
              className="flex items-center gap-2 text-[14px] font-semibold text-navy"
            >
              <FileText className="size-4 text-brand-blue" />
              <span>Describe the Case Facts & Legal Issues</span>
            </label>

            <button
              type="button"
              onClick={() => handleApplySample(DEFAULT_QUERY, "Bail & Personal Liberty")}
              className="text-[12.5px] font-medium text-brand-blue hover:text-navy underline-offset-4 hover:underline"
            >
              Reset to Original Case Facts
            </button>
          </div>

          {/* Large Text Area */}
          <div className="relative">
            <textarea
              id="case-description"
              name="case-description"
              rows={6}
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Describe the relevant facts, legal issues, applicable sections and relief requested…"
              className="w-full resize-y rounded-xl border border-border/80 bg-background/60 p-4 text-[14.5px] leading-relaxed text-foreground placeholder:text-muted-foreground/70 focus:border-brand-blue focus:bg-background focus:outline-none transition-colors"
            />
            {wordCount > 0 && (
              <div className="absolute right-3 bottom-3 rounded bg-surface/90 px-2 py-0.5 text-[11px] font-mono text-muted-foreground border border-border/60">
                {wordCount} {wordCount === 1 ? "word" : "words"}
              </div>
            )}
          </div>

          {/* Quick Presets by Category */}
          <div className="mt-4 pt-3 border-t border-border/60">
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground mb-2">
              <Lightbulb className="size-3.5 text-saffron" />
              <span>Quick templates by category:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.filter((c) => c.id !== "All").map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleApplySample(cat.sampleQuery, cat.id)}
                  className={`rounded-md border px-2.5 py-1 text-[12px] font-medium transition-colors ${
                    selectedCategory === cat.id
                      ? "border-navy bg-navy/10 text-navy font-semibold"
                      : "border-border bg-background hover:border-brand-blue hover:bg-surface text-foreground/80"
                  }`}
                >
                  {cat.shortLabel}
                </button>
              ))}
            </div>
          </div>

          {/* Search Guidance Hints */}
          <div className="mt-4 rounded-lg bg-navy/3 p-3 text-[12px] text-muted-foreground">
            <span className="font-semibold text-navy">Guidance for best retrieval:</span>
            <ul className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
              {HINTS.map((hint) => (
                <li key={hint} className="flex items-center gap-1.5">
                  <CheckCircle className="size-3 text-brand-blue shrink-0" />
                  <span>{hint}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Bar */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isEmpty || isSearching}
                className="inline-flex items-center gap-2.5 rounded-xl bg-navy px-6 py-3 text-[14.5px] font-semibold text-primary-foreground shadow-md transition-all hover:bg-navy/90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer"
              >
                {isSearching ? (
                  <>
                    <span className="size-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                    <span>Analyzing Legal Corpus…</span>
                  </>
                ) : (
                  <>
                    <Search className="size-4 text-saffron" aria-hidden="true" />
                    <span>Search Similar Precedents</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClear}
                disabled={isEmpty && !query}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13.5px] font-medium text-muted-foreground hover:bg-accent hover:text-navy transition-colors disabled:opacity-40"
              >
                <RotateCcw className="size-3.5" />
                <span>Clear</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
              <Shield className="size-3.5 text-brand-blue" />
              <span>Local hybrid retrieval with source-linked evidence</span>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="mt-5 text-[11.5px] leading-relaxed text-muted-foreground/80 border-t border-border/40 pt-3">
            <strong>Disclaimer:</strong> Citizen Legal AI is an assistive legal research prototype.
            Use anonymized facts only. Rankings are retrieval signals—not legal accuracy—and every
            result must be verified against the original judgment.
          </p>
        </form>
      </div>
    </section>
  );
}
