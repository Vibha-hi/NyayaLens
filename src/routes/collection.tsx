import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, FolderOpen, Trash2, Edit3, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/legal/Navbar";
import { SiteFooter } from "@/components/legal/SiteFooter";
import { SavedCaseItem } from "@/components/legal/SavedCaseItem";

interface SavedCase {
  id: string;
  case_id: string;
  title: string;
  court: string;
  year: string;
  citation: string;
  notes: string;
  saved_at: string;
}

interface CollectionData {
  id: string;
  name: string;
  description: string;
  color: string;
}

export const Route = createFileRoute("/collection")({
  head: () => ({
    meta: [
      { title: "Nyayalens — Collection" },
      { name: "description", content: "View saved cases in this collection." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    id: (search["id"] as string) ?? "",
  }),
  component: CollectionPage,
});

function CollectionPage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { id } = Route.useSearch();

  const [collection, setCollection] = useState<CollectionData | null>(null);
  const [cases, setCases] = useState<SavedCase[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit collection state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/auth" });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user || !id) return;

    const loadCollection = async () => {
      setLoading(true);
      const { data: col } = await supabase
        .from("collections")
        .select("id, name, description, color")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (!col) {
        navigate({ to: "/profile" });
        return;
      }

      setCollection(col);
      setEditName(col.name);
      setEditDesc(col.description);

      const { data: savedCases } = await supabase
        .from("saved_cases")
        .select("id, case_id, title, court, year, citation, notes, saved_at")
        .eq("collection_id", id)
        .eq("user_id", user.id)
        .order("saved_at", { ascending: false });

      setCases(savedCases ?? []);
      setLoading(false);
    };
    loadCollection();
  }, [user, id, navigate]);

  const handleUpdateCollection = async () => {
    if (!user || !collection || !editName.trim()) return;
    setSavingEdit(true);
    await supabase
      .from("collections")
      .update({
        name: editName.trim(),
        description: editDesc.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", collection.id)
      .eq("user_id", user.id);
    setCollection((prev) =>
      prev ? { ...prev, name: editName.trim(), description: editDesc.trim() } : prev,
    );
    setSavingEdit(false);
    setIsEditing(false);
  };

  const handleDeleteCollection = async () => {
    if (!user || !collection) return;
    if (!confirm(`Delete "${collection.name}" and all its saved cases? This cannot be undone.`))
      return;
    await supabase.from("collections").delete().eq("id", collection.id).eq("user_id", user.id);
    navigate({ to: "/profile" });
  };

  const handleUpdateNotes = async (savedCaseId: string, notes: string) => {
    if (!user) return;
    await supabase
      .from("saved_cases")
      .update({ notes, updated_at: new Date().toISOString() })
      .eq("id", savedCaseId)
      .eq("user_id", user.id);
    setCases((prev) => prev.map((c) => (c.id === savedCaseId ? { ...c, notes } : c)));
  };

  const handleRemoveCase = async (savedCaseId: string) => {
    if (!user) return;
    await supabase.from("saved_cases").delete().eq("id", savedCaseId).eq("user_id", user.id);
    setCases((prev) => prev.filter((c) => c.id !== savedCaseId));
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-[14px] text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!collection) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-brand-blue/20">
      <Navbar activeCategory="All" onSelectCategory={() => {}} />

      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-4xl">
          {/* Back link */}
          <Link
            to="/profile"
            className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-blue hover:text-navy hover:underline"
          >
            <ArrowLeft className="size-4" />
            Back to Workspace
          </Link>

          {/* Collection header */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-subtle">
            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-2.5 px-3 font-serif text-xl font-bold text-navy focus:border-brand-blue focus:outline-none"
                  autoFocus
                />
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Description"
                  className="w-full rounded-lg border border-border bg-background py-2 px-3 text-[14px] text-navy placeholder:text-muted-foreground/50 focus:border-brand-blue focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleUpdateCollection}
                    disabled={savingEdit || !editName.trim()}
                    className="inline-flex items-center gap-1 rounded-md bg-navy px-3 py-1.5 text-[12px] font-medium text-white hover:bg-navy/90 disabled:opacity-60"
                  >
                    <Check className="size-3" />
                    {savingEdit ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditName(collection.name);
                      setEditDesc(collection.description);
                      setIsEditing(false);
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:bg-accent"
                  >
                    <X className="size-3" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 border border-brand-blue/20">
                    <FolderOpen className="size-6 text-brand-blue" />
                  </div>
                  <div>
                    <h1 className="font-serif text-2xl font-bold text-navy">{collection.name}</h1>
                    {collection.description && (
                      <p className="mt-1 text-[13px] text-muted-foreground">
                        {collection.description}
                      </p>
                    )}
                    <p className="mt-2 text-[12px] text-muted-foreground/60">
                      {cases.length} {cases.length === 1 ? "case" : "cases"} saved
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-navy transition-colors"
                    title="Edit collection"
                  >
                    <Edit3 className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteCollection}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Delete collection"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Cases list */}
          <div className="mt-8">
            {cases.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
                <FolderOpen className="mx-auto size-10 text-muted-foreground/30" />
                <h3 className="mt-4 font-serif text-lg font-bold text-navy">
                  No cases saved yet
                </h3>
                <p className="mt-2 text-[13px] text-muted-foreground">
                  Search for precedents and save relevant cases to this collection.
                </p>
                <Link
                  to="/search"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-navy px-6 py-3 text-[14px] font-semibold text-white shadow-md hover:bg-navy/90 transition-colors"
                >
                  Search Precedents
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {cases.map((c) => (
                  <SavedCaseItem
                    key={c.id}
                    id={c.id}
                    caseId={c.case_id}
                    title={c.title}
                    court={c.court}
                    year={c.year}
                    citation={c.citation}
                    notes={c.notes}
                    savedAt={c.saved_at}
                    onUpdateNotes={handleUpdateNotes}
                    onRemove={handleRemoveCase}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
