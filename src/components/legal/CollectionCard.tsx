import { Link } from "@tanstack/react-router";
import { FolderOpen, ChevronRight } from "lucide-react";

const COLOR_MAP: Record<string, string> = {
  blue: "bg-brand-blue/10 border-brand-blue/30 text-brand-blue",
  teal: "bg-teal/10 border-teal/30 text-teal",
  saffron: "bg-saffron/10 border-saffron/30 text-saffron",
  emerald: "bg-emerald-100 border-emerald-300 text-emerald-700",
  rose: "bg-rose-100 border-rose-300 text-rose-700",
  purple: "bg-purple-100 border-purple-300 text-purple-700",
};

interface CollectionCardProps {
  id: string;
  name: string;
  description: string;
  color: string;
  caseCount: number;
}

export function CollectionCard({ id, name, description, color, caseCount }: CollectionCardProps) {
  const colorClasses = COLOR_MAP[color] || COLOR_MAP["blue"];

  return (
    <Link
      to="/collection"
      search={{ id }}
      className="group flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-subtle transition-all hover:shadow-md hover:border-brand-blue/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${colorClasses}`}>
          <FolderOpen className="size-5" />
        </div>
        <ChevronRight className="mt-1 size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <h3 className="mt-3 font-serif text-[16px] font-bold text-navy leading-snug line-clamp-2">
        {name}
      </h3>

      {description && (
        <p className="mt-1 text-[12px] text-muted-foreground line-clamp-2">{description}</p>
      )}

      <div className="mt-auto pt-4">
        <span className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          {caseCount} {caseCount === 1 ? "case" : "cases"}
        </span>
      </div>
    </Link>
  );
}
