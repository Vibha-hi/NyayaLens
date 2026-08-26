import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Scale,
  Briefcase,
  FolderPlus,
  LogOut,
  BookmarkCheck,
  FolderOpen,
  X,
  Search,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/legal/Navbar";
import { SiteFooter } from "@/components/legal/SiteFooter";
import { ProfileSetup } from "@/components/legal/ProfileSetup";
import { CollectionCard } from "@/components/legal/CollectionCard";

const COLLECTION_COLORS = [
  { id: "blue", label: "Blue", className: "bg-brand-blue" },
  { id: "teal", label: "Teal", className: "bg-teal" },
  { id: "saffron", label: "Saffron", className: "bg-saffron" },
  { id: "emerald", label: "Emerald", className: "bg-emerald-500" },
  { id: "rose", label: "Rose", className: "bg-rose-500" },
  { id: "purple", label: "Purple", className: "bg-purple-500" },
];

interface Collection {
  id: string;
  name: string;
  description: string;
  color: string;
  case_count: number;
}

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Nyayalens — My Workspace" },
      {
        name: "description",
        content: "Your personalized legal research workspace on Nyayalens.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [totalCases, setTotalCases] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  // New collection modal
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newColor, setNewColor] = useState("blue");
  const [creating, setCreating] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: "/auth" });
    }
  }, [isLoading, user, navigate]);

  // Load collections with case counts
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoadingData(true);
      // Get collections
      const { data: cols } = await supabase
        .from("collections")
        .select("id, name, description, color")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Get case counts per collection
      const { data: cases } = await supabase
        .from("saved_cases")
        .select("collection_id")
        .eq("user_id", user.id);

      const countMap: Record<string, number> = {};
      (cases ?? []).forEach((c) => {
        countMap[c.collection_id] = (countMap[c.collection_id] || 0) + 1;
      });

      const enriched = (cols ?? []).map((col) => ({
        ...col,
        case_count: countMap[col.id] || 0,
      }));

      setCollections(enriched);
      setTotalCases((cases ?? []).length);
      setLoadingData(false);
    };
    loadData();
  }, [user]);

  const handleCreate = async () => {
    if (!user || !newName.trim()) return;
    setCreating(true);
    const { data, error } = await supabase
      .from("collections")
      .insert({
        user_id: user.id,
        name: newName.trim(),
        description: newDesc.trim(),
        color: newColor,
      })
      .select("id, name, description, color")
      .single();
    setCreating(false);
    if (!error && data) {
      setCollections((prev) => [{ ...data, case_count: 0 }, ...prev]);
      setShowCreate(false);
      setNewName("");
      setNewDesc("");
      setNewColor("blue");
    }
  };

  if (isLoading || (!user && !isLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-[14px] text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const needsSetup = !profile?.name;

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-brand-blue/20">
      <Navbar activeCategory="All" onSelectCategory={() => {}} />

      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl">
          {/* Profile Header */}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-navy text-2xl font-bold text-saffron shadow-lg">
                {profile?.initials || user?.email?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold text-navy">
                  {profile?.name || "Your Workspace"}
                </h1>
                {profile?.specialization && (
                  <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                    <Briefcase className="size-3.5" />
                    {profile.specialization}
                  </p>
                )}
                <p className="mt-0.5 text-[12px] text-muted-foreground/60">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/search"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-[13px] font-medium text-navy hover:bg-accent transition-colors"
              >
                <Search className="size-4 text-brand-blue" />
                Search Cases
              </Link>
              <button
                type="button"
                onClick={signOut}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-[13px] font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
              >
                <LogOut className="size-4" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Profile setup if needed */}
          {needsSetup && (
            <div className="mt-8">
              <ProfileSetup />
            </div>
          )}

          {/* Stats */}
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                <FolderOpen className="size-4 text-brand-blue" />
                Collections
              </div>
              <p className="mt-1 font-serif text-2xl font-bold text-navy">{collections.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                <BookmarkCheck className="size-4 text-saffron" />
                Saved Cases
              </div>
              <p className="mt-1 font-serif text-2xl font-bold text-navy">{totalCases}</p>
            </div>
            <div className="hidden sm:block rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Scale className="size-4 text-teal" />
                Status
              </div>
              <p className="mt-1 text-[14px] font-semibold text-emerald-600">Active</p>
            </div>
          </div>

          {/* Collections */}
          <div className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-navy">Your Collections</h2>
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-[13px] font-medium text-white shadow-md hover:bg-navy/90 transition-colors"
              >
                <FolderPlus className="size-4 text-saffron" />
                New Collection
              </button>
            </div>

            {loadingData ? (
              <div className="mt-8 text-center text-[14px] text-muted-foreground">
                Loading your collections...
              </div>
            ) : collections.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
                <FolderOpen className="mx-auto size-12 text-muted-foreground/30" />
                <h3 className="mt-4 font-serif text-lg font-bold text-navy">No collections yet</h3>
                <p className="mt-2 text-[13px] text-muted-foreground">
                  Create your first collection to start saving and organizing legal precedents by
                  client or matter.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-navy px-6 py-3 text-[14px] font-semibold text-white shadow-md hover:bg-navy/90 transition-colors"
                >
                  <FolderPlus className="size-5 text-saffron" />
                  Create First Collection
                </button>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {collections.map((col) => (
                  <CollectionCard
                    key={col.id}
                    id={col.id}
                    name={col.name}
                    description={col.description}
                    color={col.color}
                    caseCount={col.case_count}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create collection modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
            onClick={() => setShowCreate(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-lg font-bold text-navy">New Collection</h2>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-accent"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-navy">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Client: Rahul Sharma"
                  className="w-full rounded-lg border border-border bg-background py-2.5 px-3 text-[14px] text-navy placeholder:text-muted-foreground/50 focus:border-brand-blue focus:outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-navy">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Brief description of this matter"
                  className="w-full rounded-lg border border-border bg-background py-2.5 px-3 text-[14px] text-navy placeholder:text-muted-foreground/50 focus:border-brand-blue focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-navy">Color</label>
                <div className="flex items-center gap-2.5">
                  {COLLECTION_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNewColor(c.id)}
                      className={`size-8 rounded-full ${c.className} border-2 transition-transform ${
                        newColor === c.id
                          ? "border-navy scale-110 ring-2 ring-navy/20"
                          : "border-transparent hover:scale-105"
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-lg border border-border px-4 py-2 text-[13px] font-medium text-muted-foreground hover:bg-accent"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="rounded-lg bg-navy px-5 py-2 text-[13px] font-semibold text-white shadow-md hover:bg-navy/90 disabled:opacity-60"
              >
                {creating ? "Creating..." : "Create Collection"}
              </button>
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}
