import { createFileRoute, Link } from "@tanstack/react-router";
import { Scale, Search, ShieldCheck, History, ArrowRight, BookmarkCheck } from "lucide-react";
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
  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-brand-blue/20">
      <Navbar
        activeCategory="All"
        onSelectCategory={() => {}}
      />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 sm:px-6">
        <div className="max-w-4xl text-center">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-navy text-saffron shadow-lg">
            <Scale className="size-8" />
          </div>

          <h1 className="font-serif text-4xl font-bold tracking-tight text-navy sm:text-6xl mb-6">
            Nyayalens
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl mb-10 leading-relaxed">
            Source-Linked Hybrid Precedent Retrieval. Search an imported judgment corpus using local dense embeddings and exact legal-term matching.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/search"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-8 py-4 text-base font-semibold text-white shadow-md hover:bg-navy/90 transition-all hover:scale-105"
            >
              Start Researching
              <ArrowRight className="size-5 text-saffron" />
            </Link>
          </div>
        </div>

        <div className="mt-24 grid w-full max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: <Search className="size-6 text-brand-blue" />,
              title: "Hybrid Retrieval",
              desc: "Combines dense AI semantic search with exact SQLite FTS5 lexical matching for unparalleled accuracy."
            },
            {
              icon: <ShieldCheck className="size-6 text-emerald-600" />,
              title: "Source-Linked",
              desc: "Every result highlights the exact verbatim evidence passage from the source judgment. No AI hallucinations."
            },
            {
              icon: <History className="size-6 text-saffron" />,
              title: "Local & Private",
              desc: "Runs entirely locally using ONNX embeddings. No API keys required and completely offline."
            },
            {
              icon: <BookmarkCheck className="size-6 text-purple-600" />,
              title: "Lawyer Workspace",
              desc: "Save cases into client-specific collections, annotate them with notes, and access them anytime."
            }
          ].map((feature, i) => (
            <div key={i} className="flex flex-col items-center rounded-2xl border border-border bg-surface p-8 text-center shadow-subtle hover:shadow-md transition-shadow">
              <div className="mb-4 rounded-xl bg-navy/5 p-3">
                {feature.icon}
              </div>
              <h3 className="mb-2 text-lg font-bold text-navy">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
