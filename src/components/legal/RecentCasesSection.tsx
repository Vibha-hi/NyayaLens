import { useState } from "react";
import {
  Gavel,
  Calendar,
  Building,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Copy,
  Search,
  Check,
  Scale,
} from "lucide-react";
import {
  RECENT_CASES,
  CATEGORIES,
  type LegalCategory,
  type RecentCase,
} from "@/data/precedents";

interface RecentCasesSectionProps {
  activeCategory: LegalCategory;
  onSelectCategory: (category: LegalCategory) => void;
  onUseAsQuery: (query: string) => void;
}

export function RecentCasesSection({
  activeCategory,
  onSelectCategory,
  onUseAsQuery,
}: RecentCasesSectionProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredCases =
    activeCategory === "All"
      ? RECENT_CASES
      : RECENT_CASES.filter((c) => c.category === activeCategory);

  const handleCopyCitation = (citation: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(citation);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCategoryBadgeClass = (category: LegalCategory) => {
    switch (category) {
      case "Murder & Violent Crime":
        return "bg-rose-50 text-rose-700 border-rose-200/80";
      case "Property & Land Dispute":
        return "bg-amber-50 text-amber-800 border-amber-200/80";
      case "Bail & Personal Liberty":
        return "bg-blue-50 text-blue-700 border-blue-200/80";
      case "Cybercrime & IT Act":
        return "bg-purple-50 text-purple-700 border-purple-200/80";
      case "Domestic Violence & Family":
        return "bg-pink-50 text-pink-700 border-pink-200/80";
      case "Fraud & Economic Offences":
        return "bg-emerald-50 text-emerald-800 border-emerald-200/80";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getStatusBadge = (status: RecentCase["status"]) => {
    switch (status) {
      case "Landmark Precedent":
        return "border-rose-200 bg-rose-500/10 text-rose-700";
      case "Bail Granted":
        return "border-emerald-200 bg-emerald-500/10 text-emerald-700";
      case "Rule Settled":
        return "border-purple-200 bg-purple-500/10 text-purple-700";
      default:
        return "border-brand-blue/30 bg-brand-blue/10 text-brand-blue";
    }
  };

  return (
    <section aria-labelledby="recent-cases-heading" className="py-12 sm:py-16">
      {/* Header with Live Indicator */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex size-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[12px] font-semibold text-emerald-700 uppercase tracking-wider">
              Recent Judgments & Settled Precedents
            </span>
          </div>
          <h2
            id="recent-cases-heading"
            className="text-[26px] font-semibold text-navy sm:text-[30px] leading-tight"
          >
            What Just Happened in the Courts
          </h2>
          <p className="mt-1.5 text-[14.5px] text-muted-foreground max-w-2xl leading-relaxed">
            Explore recent rulings across key legal domains. Click{" "}
            <span className="font-semibold text-navy">"Find Similar Precedents"</span> on any case to
            load its factual matrix directly into the AI search engine.
          </p>
        </div>

        {/* Total count chip */}
        <div className="flex items-center gap-2 self-start md:self-auto rounded-lg border border-border bg-surface px-3.5 py-2 shadow-2xs">
          <Scale className="size-4 text-brand-blue" />
          <span className="text-[13px] font-medium text-navy">
            Showing <strong className="text-brand-blue">{filteredCases.length}</strong> recent{" "}
            {filteredCases.length === 1 ? "case" : "cases"}
          </span>
        </div>
      </div>

      {/* Category Pills Strip */}
      <div className="mt-6 flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          const count =
            cat.id === "All"
              ? RECENT_CASES.length
              : RECENT_CASES.filter((c) => c.category === cat.id).length;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`group inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-all shrink-0 ${
                isActive
                  ? "border-navy bg-navy text-primary-foreground shadow-2xs font-semibold"
                  : "border-border bg-surface text-foreground/80 hover:border-brand-blue hover:text-navy hover:bg-surface/80"
              }`}
            >
              <span>{cat.shortLabel}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10.5px] font-semibold transition-colors ${
                  isActive
                    ? "bg-saffron text-navy"
                    : "bg-muted text-muted-foreground group-hover:bg-brand-blue/10 group-hover:text-brand-blue"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Cases Cards Grid */}
      {filteredCases.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border bg-surface p-12 text-center">
          <BookOpen className="mx-auto size-10 text-muted-foreground/60 mb-3" />
          <h3 className="text-[17px] font-semibold text-navy">No recent cases in this category yet</h3>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            We are continuously indexing fresh court judgments. Check back soon or switch categories.
          </p>
          <button
            type="button"
            onClick={() => onSelectCategory("All")}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-navy px-4 py-2 text-[13px] font-medium text-white hover:bg-navy/90"
          >
            Show All Categories
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {filteredCases.map((caseItem) => {
            const isCopied = copiedId === caseItem.id;

            return (
              <article
                key={caseItem.id}
                className="group relative flex flex-col justify-between rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-subtle transition-all duration-200 hover:-translate-y-1 hover:border-brand-blue/60 hover:shadow-card-hover"
              >
                <div>
                  {/* Top Metadata row: Court, Status & Category */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium text-navy">
                        <Building className="size-3 text-brand-blue" />
                        {caseItem.court}
                      </span>
                      <span
                        className={`rounded-md border px-2 py-0.8 text-[10.5px] font-semibold uppercase tracking-wider ${getStatusBadge(
                          caseItem.status,
                        )}`}
                      >
                        {caseItem.status}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${getCategoryBadgeClass(
                        caseItem.category,
                      )}`}
                    >
                      {caseItem.category}
                    </span>
                  </div>

                  {/* Date & Citation */}
                  <div className="mt-3.5 flex items-center justify-between text-[12px] text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-muted-foreground/80" />
                      <span>{caseItem.date}</span>
                      <span className="text-[10px] text-muted-foreground/60">•</span>
                      <span className="font-medium text-brand-blue">{caseItem.daysAgo}</span>
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleCopyCitation(caseItem.citation, caseItem.id, e)}
                      title="Copy citation"
                      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11.5px] font-mono text-muted-foreground hover:bg-accent hover:text-navy transition-colors"
                    >
                      {isCopied ? (
                        <>
                          <Check className="size-3 text-emerald-600" />
                          <span className="text-emerald-600 font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3" />
                          <span>{caseItem.citation}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Title & Bench */}
                  <div className="mt-3">
                    <h3 className="font-serif text-[18px] font-bold text-navy leading-snug group-hover:text-brand-blue transition-colors">
                      {caseItem.title}
                    </h3>
                    <p className="mt-1 text-[12px] font-medium text-muted-foreground">
                      {caseItem.bench}
                    </p>
                  </div>

                  {/* Summary */}
                  <p className="mt-3 text-[13.5px] leading-relaxed text-foreground/85">
                    {caseItem.summary}
                  </p>

                  {/* Key Takeaway Callout */}
                  <div className="mt-4 rounded-lg border border-saffron/30 bg-saffron/5 p-3">
                    <div className="flex items-start gap-2">
                      <Gavel className="size-4 shrink-0 text-saffron mt-0.5" />
                      <div>
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-saffron">
                          Core Ratio / Settled Rule
                        </span>
                        <p className="mt-0.5 text-[12.5px] font-medium text-navy/90 leading-snug">
                          {caseItem.keyTakeaway}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Statute tag */}
                  <div className="mt-3 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                    <BookOpen className="size-3.5 text-brand-blue" />
                    <span>Statute: </span>
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                      {caseItem.statute}
                    </code>
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="mt-6 pt-4 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => onUseAsQuery(caseItem.searchableDescription)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-navy/5 hover:bg-navy px-4 py-2.5 text-[13px] font-semibold text-navy hover:text-white transition-all duration-200 group/btn"
                  >
                    <Search className="size-3.5 text-brand-blue group-hover/btn:text-saffron transition-colors" />
                    <span>Find Similar Precedents</span>
                    <ArrowUpRight className="size-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
