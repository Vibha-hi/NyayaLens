export function ResultSkeleton() {
  return (
    <div aria-live="polite" aria-busy="true" className="divide-y divide-border">
      <span className="sr-only">Searching precedent records…</span>
      {[0, 1, 2].map((index) => (
        <div key={index} className="py-6">
          <div className="h-3.5 w-24 rounded bg-muted" />
          <div className="mt-3 h-5 w-2/3 rounded bg-muted" />
          <div className="mt-3 h-3 w-1/3 rounded bg-muted" />
          <div className="mt-4 h-14 w-full rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
