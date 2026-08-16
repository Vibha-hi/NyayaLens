import { Search } from "lucide-react";

interface SearchPanelProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  isSearching: boolean;
}

const HINTS = ["Include important facts", "Mention relevant sections", "Describe the relief requested"];

export function SearchPanel({ query, onQueryChange, onSearch, onClear, isSearching }: SearchPanelProps) {
  const isEmpty = query.trim().length === 0;

  return (
    <section aria-labelledby="search-heading" className="border-b border-border bg-surface">
      <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 sm:py-12">
        <div className="max-w-3xl">
          <h1 id="search-heading" className="text-[28px] leading-tight font-semibold text-navy sm:text-[34px]">
            Find Similar Legal Precedents
          </h1>
          <p className="mt-3 text-[15px] text-muted-foreground">
            Describe the facts, legal issues and procedural situation of a case to retrieve similar demonstration
            precedents.
          </p>
        </div>

        <form
          className="mt-8 max-w-3xl"
          onSubmit={(event) => {
            event.preventDefault();
            if (!isEmpty) onSearch();
          }}
        >
          <label htmlFor="case-description" className="block text-[13px] font-medium text-navy">
            Case description
          </label>
          <textarea
            id="case-description"
            name="case-description"
            rows={6}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Describe the relevant facts, legal issues, applicable sections and relief requested…"
            className="mt-2 w-full resize-y rounded-md border border-border bg-background px-3.5 py-3 text-[14px] leading-relaxed text-foreground placeholder:text-muted-foreground/80 focus:border-brand-blue focus:outline-none"
          />

          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[12px] text-muted-foreground">
            {HINTS.map((hint) => (
              <li key={hint}>{hint}</li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={isEmpty || isSearching}
              className="inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2.5 text-[14px] font-medium text-primary-foreground transition-colors hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Search className="size-4" aria-hidden="true" />
              Search Similar Cases
            </button>
            <button
              type="button"
              onClick={onClear}
              className="rounded-md px-1 py-1 text-[14px] text-brand-blue underline-offset-4 hover:underline"
            >
              Clear
            </button>
          </div>

          <p className="mt-5 max-w-2xl text-[12px] leading-relaxed text-muted-foreground">
            Prototype for legal research assistance only. Results must be verified from the original judgment and must
            not be treated as legal advice.
          </p>
        </form>
      </div>
    </section>
  );
}
