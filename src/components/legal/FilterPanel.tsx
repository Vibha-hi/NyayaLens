import { COURTS, FILTER_ISSUES, YEARS } from "@/data/precedents";

export interface Filters {
  court: string;
  year: string;
  issue: string;
}

export const DEFAULT_FILTERS: Filters = {
  court: "All Courts",
  year: "All Years",
  issue: "All Issues",
};

interface FilterPanelProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onReset: () => void;
}

function Group({
  legend,
  name,
  options,
  value,
  onSelect,
}: {
  legend: string;
  name: string;
  options: string[];
  value: string;
  onSelect: (option: string) => void;
}) {
  return (
    <fieldset className="mt-6 first:mt-0">
      <legend className="text-[12px] font-semibold tracking-wide text-navy uppercase">
        {legend}
      </legend>
      <div className="mt-2.5 space-y-1.5">
        {options.map((option) => (
          <label
            key={option}
            className="flex cursor-pointer items-center gap-2 text-[13px] text-foreground"
          >
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onSelect(option)}
              className="size-3.5 accent-[var(--brand-blue)]"
            />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function FilterPanel({ filters, onChange, onReset }: FilterPanelProps) {
  return (
    <div className="rounded-md border border-border bg-surface p-4 shadow-subtle">
      <h2 className="font-serif text-[16px] font-semibold text-navy">Refine Results</h2>

      <Group
        legend="Court level"
        name="court"
        options={["All Courts", ...COURTS]}
        value={filters.court}
        onSelect={(court) => onChange({ ...filters, court })}
      />
      <Group
        legend="Year"
        name="year"
        options={["All Years", ...YEARS]}
        value={filters.year}
        onSelect={(year) => onChange({ ...filters, year })}
      />
      <Group
        legend="Legal issue"
        name="issue"
        options={["All Issues", ...FILTER_ISSUES]}
        value={filters.issue}
        onSelect={(issue) => onChange({ ...filters, issue })}
      />

      <button
        type="button"
        onClick={onReset}
        className="mt-6 rounded-md border border-border px-2.5 py-1.5 text-[12px] text-navy hover:bg-accent"
      >
        Reset filters
      </button>
    </div>
  );
}
