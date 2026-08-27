import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookmarkCheck, History, Scale, Search, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/legal/Navbar";
import { SiteFooter } from "@/components/legal/SiteFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nyayalens — Next-Generation Legal Research" },
      {
        name: "description",
        content:
          "AI-powered semantic search and exact legal-term matching for Indian Supreme Court and High Court precedents.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const features = [
    {
      icon: <Search className="size-6 text-brand-blue" />,
      title: "Hybrid Retrieval",
      description: "Combines local semantic retrieval with exact SQLite FTS5 legal-term matching.",
    },
    {
      icon: <ShieldCheck className="size-6 text-emerald-600" />,
      title: "Source-Linked",
      description:
        "Every result links to the source judgment and identifies its supporting passage.",
    },
    {
      icon: <History className="size-6 text-saffron" />,
      title: "Local & Private",
      description: "Uses local ONNX embeddings without requiring a paid search API key.",
    },
    {
      icon: <BookmarkCheck className="size-6 text-purple-600" />,
      title: "Lawyer Workspace",
      description: "Save cases into collections and keep research notes together.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-brand-blue/20">
      <Navbar activeCategory="All" onSelectCategory={() => {}} />

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-6">
        <div className="max-w-4xl text-center">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-navy text-saffron shadow-lg">
            <Scale className="size-8" />
          </div>

          <h1 className="mb-6 font-serif text-4xl font-bold tracking-tight text-navy sm:text-6xl">
            Nyayalens
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Source-linked hybrid precedent retrieval over an imported judgment corpus using local
            dense embeddings and exact legal-term matching.
          </p>

          <Link
            to="/search"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-8 py-4 text-base font-semibold text-white shadow-md transition-all hover:scale-105 hover:bg-navy/90"
          >
            Start Researching
            <ArrowRight className="size-5 text-saffron" />
          </Link>
        </div>

        <div className="mt-24 grid w-full max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col items-center rounded-2xl border border-border bg-surface p-8 text-center shadow-subtle transition-shadow hover:shadow-md"
            >
              <div className="mb-4 rounded-xl bg-navy/5 p-3">{feature.icon}</div>
              <h2 className="mb-2 text-lg font-bold text-navy">{feature.title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
