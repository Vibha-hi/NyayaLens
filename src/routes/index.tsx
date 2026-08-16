import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { SiteHeader } from "@/components/legal/SiteHeader";
import { SiteFooter } from "@/components/legal/SiteFooter";
import { SearchPanel } from "@/components/legal/SearchPanel";
import { FilterPanel, DEFAULT_FILTERS, type Filters } from "@/components/legal/FilterPanel";
import { PrecedentItem } from "@/components/legal/PrecedentItem";
import { ResultSkeleton } from "@/components/legal/ResultSkeleton";
import { DEFAULT_QUERY, PRECEDENTS } from "@/data/precedents";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Citizen Legal AI — Precedent Retrieval Prototype" },
      {
        name: "description",
        content:
          "A frontend prototype that retrieves similar demonstration court precedents from a case description, with matched evidence and match explanations.",
      },
      { property: "og:title", content: "Citizen Legal AI — Precedent Retrieval Prototype" },
      {
        property: "og:description",
        content:
          "Describe a case and review fictional demonstration precedents with matched evidence and explanations. Demonstration only.",
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
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [expandedId, setExpandedId] = useState<string | null>(PRECEDENTS[0]!.id);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const results = useMemo(
    () =>
      PRECEDENTS.filter((precedent) => {
        if (filters.court !== "All Courts" && precedent.court !== filters.court) return false;
        if (filters.year !== "All Years" && precedent.year !== filters.year) return false;
        if (filters.issue !== "All Issues" && !precedent.filterIssues.includes(filters.issue)) return false;
        return true;
      }),
    [filters],
  );

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  const handleSearch = () => {
    setIsSearching(true);
    setHasSearched(true);
    setExpandedId(PRECEDENTS[0]!.id);
    window.setTimeout(() => setIsSearching(false), 600);
  };

  const handleClear = () => {
    setQuery("");
    setHasSearched(false);
    setIsSearching(false);
    resetFilters();
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <SearchPanel
          query={query}
          onQueryChange={setQuery}
          onSearch={handleSearch}
          onClear={handleClear}
          isSearching={isSearching}
        />

        <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6">
          {!hasSearched ? (
            <p className="rounded-md border border-border bg-surface px-4 py-8 text-center text-[14px] text-muted-foreground">
              Enter a case description to begin searching the demonstration records.
            </p>
          ) : (
            <div className="flex flex-col gap-8 lg:flex-row">
              <aside className="lg:w-[260px] lg:shrink-0" aria-label="Result filters">
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
                  <FilterPanel filters={filters} onChange={setFilters} onReset={resetFilters} />
                </div>
              </aside>

              <section className="min-w-0 flex-1" aria-label="Search results">
                <p className="rounded-md border border-border bg-surface px-3.5 py-2.5 text-[12px] leading-relaxed text-muted-foreground">
                  Prototype retrieval flow: case description → semantic and legal-term matching → fused ranking →
                  source-linked evidence
                </p>

                <div className="mt-6 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <h2 className="text-[20px] font-semibold text-navy">
                      {results.length} Similar Precedent{results.length === 1 ? "" : "s"}
                    </h2>
                    <p className="mt-1 text-[12.5px] text-muted-foreground">
                      Ranked using semantic similarity and legal-term matching
                    </p>
                  </div>
                  <span className="rounded-md border border-border px-2 py-1 text-[11.5px] text-muted-foreground">
                    Hybrid relevance
                  </span>
                </div>

                {isSearching ? (
                  <ResultSkeleton />
                ) : results.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-[14px] text-muted-foreground">
                      No demonstration records match the selected filters.
                    </p>
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-4 rounded-md border border-border px-3 py-1.5 text-[12.5px] text-navy hover:bg-accent"
                    >
                      Reset filters
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {results.map((precedent) => (
                      <PrecedentItem
                        key={precedent.id}
                        precedent={precedent}
                        expanded={expandedId === precedent.id}
                        onToggle={() => setExpandedId((current) => (current === precedent.id ? null : precedent.id))}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
