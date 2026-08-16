import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SlidersHorizontal, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/legal/Navbar";
import { SiteFooter } from "@/components/legal/SiteFooter";
import { SearchPanel } from "@/components/legal/SearchPanel";
import { RecentCasesSection } from "@/components/legal/RecentCasesSection";
import { FilterPanel, DEFAULT_FILTERS, type Filters } from "@/components/legal/FilterPanel";
import { PrecedentItem } from "@/components/legal/PrecedentItem";
import { ResultSkeleton } from "@/components/legal/ResultSkeleton";
import { DEFAULT_QUERY, PRECEDENTS, type LegalCategory } from "@/data/precedents";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Citizen Legal AI — AI Precedent Retrieval & Recent Judgments" },
      {
        name: "description",
        content:
          "Explore recent Supreme Court & High Court cases across murder, property disputes, bail, cybercrime, and economic offences, or search factual case descriptions to retrieve matching legal precedents.",
      },
      { property: "og:title", content: "Citizen Legal AI — Precedent Retrieval Engine" },
      {
        property: "og:description",
        content:
          "Explore recent court rulings across legal categories and retrieve matching precedents with cited evidence and match explanations.",
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

  const scrollToSearch = () => {
    const searchEl = document.getElementById("search-section") || document.getElementById("case-description");
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
    // If the user hasn't searched, scroll smoothly to the recent cases section if on desktop
    if (!hasSearched) {
      const recentSection = document.getElementById("recent-cases-heading");
      if (recentSection && category !== "All") {
        recentSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const handleUseRecentCaseAsQuery = (caseQuery: string) => {
    setQuery(caseQuery);
    scrollToSearch();
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
        />

        <div className="mx-auto max-w-[1380px] px-4 py-8 sm:px-6">
          {!hasSearched ? (
            <RecentCasesSection
              activeCategory={activeCategory}
              onSelectCategory={handleSelectCategory}
              onUseAsQuery={handleUseRecentCaseAsQuery}
            />
          ) : (
            <div className="pt-4">
              <div className="mb-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setHasSearched(false)}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-1.5 text-[13px] font-medium text-navy hover:bg-accent hover:text-brand-blue transition-colors shadow-2xs"
                >
                  <ArrowLeft className="size-4" />
                  <span>← Back to Recent Court Cases</span>
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
                    <FilterPanel filters={filters} onChange={setFilters} onReset={resetFilters} />
                  </div>
                </aside>

                <section className="min-w-0 flex-1" aria-label="Search results">
                  <div className="rounded-lg border border-brand-blue/30 bg-brand-blue/5 p-3.5 text-[12.5px] leading-relaxed text-navy">
                    <strong>Precedent Retrieval Matrix:</strong> Facts and legal issues compared against indexed judgments using semantic similarity, case posture, and statutory sections.
                  </div>

                  <div className="mt-6 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
                    <div>
                      <h2 className="text-[22px] font-bold text-navy">
                        {results.length} Matching Precedent{results.length === 1 ? "" : "s"}
                      </h2>
                      <p className="mt-1 text-[13px] text-muted-foreground">
                        Ranked using hybrid semantic relevance and legal-term verification
                      </p>
                    </div>
                    <span className="rounded-full border border-brand-blue/40 bg-brand-blue/10 px-3 py-1 text-[12px] font-semibold text-brand-blue">
                      Hybrid Fused Relevance
                    </span>
                  </div>

                  {isSearching ? (
                    <ResultSkeleton />
                  ) : results.length === 0 ? (
                    <div className="py-16 text-center rounded-xl border border-dashed border-border bg-surface mt-6">
                      <p className="text-[15px] font-medium text-muted-foreground">
                        No precedent records match the selected filters.
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
                            setExpandedId((current) => (current === precedent.id ? null : precedent.id))
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

