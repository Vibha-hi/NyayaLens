import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/legal/Navbar";
import { SiteFooter } from "@/components/legal/SiteFooter";
import { SearchPanel } from "@/components/legal/SearchPanel";
import { FilterPanel, DEFAULT_FILTERS, type Filters } from "@/components/legal/FilterPanel";
import { PrecedentItem } from "@/components/legal/PrecedentItem";
import { ResultSkeleton } from "@/components/legal/ResultSkeleton";
import {
  COURTS,
  DEFAULT_QUERY,
  FILTER_ISSUES,
  OUTCOME_FILTERS,
  YEARS,
  type LegalCategory,
  type Precedent,
} from "@/data/precedents";
import { searchCasesFn } from "@/api/search";
import type { SearchEngineResponse } from "@/contracts/search";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nyayalens — Source-Linked Hybrid Precedent Retrieval" },
      {
        name: "description",
        content:
          "Search an imported Supreme Court and High Court judgment corpus using local dense and exact legal-term retrieval.",
      },
      { property: "og:title", content: "Nyayalens — Precedent Retrieval Engine" },
      {
        property: "og:description",
        content:
          "Retrieve matching precedents from imported judgments with exact evidence and transparent ranking traces.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeCategory, setActiveCategory] = useState<LegalCategory>("All");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [results, setResults] = useState<Precedent[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchMeta, setSearchMeta] = useState<Omit<SearchEngineResponse, "results"> | null>(null);
  const latestRequestId = useRef(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const savedQuery = params.get("case-description");
    const savedCourt = params.get("court");
    const savedYear = params.get("year");
    const savedIssue = params.get("issue");
    const savedOutcome = params.get("outcome");
    if (savedQuery) setQuery(savedQuery);
    setFilters((current) => ({
      ...current,
      court:
        savedCourt && (["All Courts", ...COURTS] as string[]).includes(savedCourt)
          ? savedCourt
          : current.court,
      year:
        savedYear && (["All Years", ...YEARS] as string[]).includes(savedYear)
          ? savedYear
          : current.year,
      issue:
        savedIssue && (["All Issues", ...FILTER_ISSUES] as string[]).includes(savedIssue)
          ? savedIssue
          : current.issue,
      outcome:
        savedOutcome && (["Any Outcome", ...OUTCOME_FILTERS] as string[]).includes(savedOutcome)
          ? savedOutcome
          : current.outcome,
    }));
  }, []);

  const executeSearch = async (currentQuery: string, currentFilters: Filters) => {
    const requestId = ++latestRequestId.current;
    setIsSearching(true);
    setHasSearched(true);
    setSearchError(null);
    const urlParams = new URLSearchParams();
    urlParams.set("case-description", currentQuery);
    if (currentFilters.court !== "All Courts") urlParams.set("court", currentFilters.court);
    if (currentFilters.year !== "All Years") urlParams.set("year", currentFilters.year);
    if (currentFilters.issue !== "All Issues") urlParams.set("issue", currentFilters.issue);
    if (currentFilters.outcome !== "Any Outcome") {
      urlParams.set("outcome", currentFilters.outcome);
    }
    window.history.replaceState(null, "", `${window.location.pathname}?${urlParams.toString()}`);
    try {
      const data = await searchCasesFn({
        data: { query: currentQuery, filters: currentFilters, topK: 10 },
      });
      if (requestId !== latestRequestId.current) return;
      setResults(data.results);
      setSearchMeta({
        runId: data.runId,
        corpusVersion: data.corpusVersion,
        modelVersion: data.modelVersion,
        retrievalMethod: data.retrievalMethod,
        extractedSignals: data.extractedSignals,
        latencyMs: data.latencyMs,
        caseCount: data.caseCount,
        chunkCount: data.chunkCount,
      });
      if (data.results.length > 0) {
        setExpandedId(data.results[0]?.id ?? null);
      } else {
        setExpandedId(null);
      }
    } catch (error) {
      if (requestId !== latestRequestId.current) return;
      console.error("Search failed:", error);
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred while searching.";
      setSearchError(message);
      setResults([]);
    } finally {
      if (requestId === latestRequestId.current) setIsSearching(false);
    }
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    if (hasSearched) {
      executeSearch(query, DEFAULT_FILTERS);
    }
  };

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
    if (hasSearched) {
      executeSearch(query, newFilters);
    }
  };

  const handleSearch = () => {
    executeSearch(query, filters);
  };

  const handleClear = () => {
    latestRequestId.current += 1;
    setQuery("");
    setHasSearched(false);
    setIsSearching(false);
    setFilters(DEFAULT_FILTERS);
    setResults([]);
    setSearchMeta(null);
    setSearchError(null);
    window.history.replaceState(null, "", window.location.pathname);
  };

  const scrollToSearch = () => {
    const searchEl =
      document.getElementById("search-section") || document.getElementById("case-description");
    if (searchEl) {
      searchEl.scrollIntoView({ behavior: "smooth", block: "center" });
      const textarea = document.getElementById("case-description") as HTMLTextAreaElement | null;
      if (textarea) {
        setTimeout(() => textarea.focus(), 300);
      }
    }
  };

  const handleSelectCategory = (category: LegalCategory) => {
    setActiveCategory(category);
    // Keep category templates and corpus information in view before the first search.
    if (!hasSearched) {
      const recentSection = document.getElementById("recent-cases-heading");
      if (recentSection && category !== "All") {
        recentSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-brand-blue/20">
      <Navbar
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
        onSearchFocus={scrollToSearch}
      />

      <main className="flex-1">
        <SearchPanel
          query={query}
          onQueryChange={setQuery}
          onSearch={handleSearch}
          onClear={handleClear}
          isSearching={isSearching}
          selectedCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
          filters={filters}
          onFiltersChange={setFilters}
        />

        <div className="mx-auto max-w-[1380px] px-4 py-8 sm:px-6">
          {!hasSearched ? (
            <section
              id="recent-cases-heading"
              aria-labelledby="corpus-heading"
              className="mx-auto max-w-4xl py-12 sm:py-16"
            >
              <div className="rounded-xl border border-border bg-surface p-6 shadow-subtle sm:p-8">
                <p className="text-[12px] font-semibold uppercase tracking-wider text-brand-blue">
                  Imported judgment corpus
                </p>
                <h2 id="corpus-heading" className="mt-2 font-serif text-[25px] font-bold text-navy">
                  Imported Supreme Court and High Court judgments
                </h2>
                <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
                  The keyless local engine searches the imported judgment collection with local
                  embeddings and exact legal-term matching. Metadata and source passages are
                  extracted from the supplied PDFs; records marked for review should be checked
                  against their source documents.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {[
                    ["Dense retrieval", "Local BGE-small passage embeddings"],
                    ["Lexical retrieval", "SQLite FTS5 legal-term search"],
                    ["Transparent fusion", "RRF with judgment-level grouping"],
                  ].map(([title, detail]) => (
                    <div key={title} className="rounded-md border border-border bg-background p-3">
                      <p className="text-[12.5px] font-semibold text-navy">{title}</p>
                      <p className="mt-1 text-[11.5px] text-muted-foreground">{detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : (
            <div className="pt-4">
              <div className="mb-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setHasSearched(false)}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-1.5 text-[13px] font-medium text-navy hover:bg-accent hover:text-brand-blue transition-colors shadow-2xs"
                >
                  <ArrowLeft className="size-4" />
                  <span>Back to corpus overview</span>
                </button>
              </div>

              <div className="flex flex-col gap-8 lg:flex-row">
                <aside className="lg:w-[280px] lg:shrink-0" aria-label="Result filters">
                  <button
                    type="button"
                    onClick={() => setFiltersOpen((open) => !open)}
                    aria-expanded={filtersOpen}
                    aria-controls="filter-panel"
                    className="mb-3 inline-flex w-full items-center justify-between rounded-md border border-border bg-surface px-3 py-2.5 text-[13px] font-medium text-navy lg:hidden"
                  >
                    <span className="inline-flex items-center gap-2">
                      <SlidersHorizontal className="size-4" aria-hidden="true" />
                      Filters
                    </span>
                    <span className="text-muted-foreground">{filtersOpen ? "Hide" : "Show"}</span>
                  </button>
                  <div id="filter-panel" className={`${filtersOpen ? "block" : "hidden"} lg:block`}>
                    <FilterPanel
                      filters={filters}
                      onChange={handleFilterChange}
                      onReset={resetFilters}
                    />
                  </div>
                </aside>

                <section className="min-w-0 flex-1" aria-label="Search results">
                  <div className="rounded-lg border border-brand-blue/30 bg-brand-blue/5 p-3.5 text-[12.5px] leading-relaxed text-navy">
                    <strong>Local hybrid retrieval:</strong> Dense passage similarity and exact
                    legal-term search are fused with Reciprocal Rank Fusion. A small authority
                    adjustment then considers court hierarchy, bench strength, recency, shared
                    issues and statutory provisions. Each result shows its relevance basis; Precision@5 is
                    measured separately on legally reviewed queries, not presented as a per-case
                    confidence score. Outcomes must be verified against the source judgment.
                  </div>

                  {searchMeta && !isSearching && (
                    <div className="mt-3 rounded-md border border-border bg-surface px-3.5 py-3 text-[12px] text-muted-foreground">
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        <span>Corpus: {searchMeta.corpusVersion}</span>
                        <span>Model: {searchMeta.modelVersion}</span>
                        <span>Search time: {searchMeta.latencyMs} ms</span>
                        <span>{searchMeta.caseCount.toLocaleString()} indexed judgments</span>
                        <span>{searchMeta.chunkCount.toLocaleString()} searchable passages</span>
                      </div>
                      {searchMeta.extractedSignals.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="font-medium text-navy">Detected signals:</span>
                          {searchMeta.extractedSignals.map((signal) => (
                            <span
                              key={signal}
                              className="rounded-md border border-border bg-background px-2 py-0.5 text-navy"
                            >
                              {signal}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
                    <div>
                      <h2 className="text-[22px] font-bold text-navy">
                        {results.length} Matching Precedent{results.length === 1 ? "" : "s"}
                      </h2>
                      <p className="mt-1 text-[13px] text-muted-foreground">
                        Ranked by dense retrieval, lexical retrieval and transparent RRF fusion
                      </p>
                    </div>
                    <span className="rounded-full border border-brand-blue/40 bg-brand-blue/10 px-3 py-1 text-[12px] font-semibold text-brand-blue">
                      Hybrid RRF ranking
                    </span>
                  </div>

                  {isSearching ? (
                    <ResultSkeleton />
                  ) : searchError ? (
                    <div className="py-12 text-center rounded-xl border border-dashed border-red-300 bg-red-50/50 mt-6">
                      <p className="text-[15px] font-medium text-red-700">Search failed</p>
                      <p className="mt-2 text-[13px] text-red-600/80 max-w-md mx-auto">
                        {searchError}
                      </p>
                      <button
                        type="button"
                        onClick={() => executeSearch(query, filters)}
                        className="mt-4 rounded-md bg-navy px-4 py-2 text-[13px] font-medium text-white hover:bg-navy/90"
                      >
                        Try again
                      </button>
                    </div>
                  ) : results.length === 0 ? (
                    <div className="py-16 text-center rounded-xl border border-dashed border-border bg-surface mt-6">
                      <p className="text-[15px] font-medium text-muted-foreground">
                        No indexed precedents match this query and the selected filters.
                      </p>
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="mt-4 rounded-md bg-navy px-4 py-2 text-[13px] font-medium text-white hover:bg-navy/90"
                      >
                        Reset all filters
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-border mt-4">
                      {results.map((precedent) => (
                        <PrecedentItem
                          key={precedent.id}
                          precedent={precedent}
                          expanded={expandedId === precedent.id}
                          onToggle={() =>
                            setExpandedId((current) =>
                              current === precedent.id ? null : precedent.id,
                            )
                          }
                        />
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
