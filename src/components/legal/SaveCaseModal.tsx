import { useEffect, useState } from "react";
import { X, FolderPlus, FolderOpen, StickyNote } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Precedent } from "@/data/precedents";

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
}

interface SaveCaseModalProps {
  precedent: Precedent;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function SaveCaseModal({ precedent, open, onClose, onSaved }: SaveCaseModalProps) {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  // New collection form state
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newColor, setNewColor] = useState("blue");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    setError("");
    supabase
      .from("collections")
      .select("id, name, description, color")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error: err }) => {
        if (err) setError("Could not load collections.");
        else setCollections(data ?? []);
        setLoading(false);
      });
  }, [open, user]);

  if (!open) return null;

  const handleCreateCollection = async () => {
    if (!user || !newName.trim()) return;
    setCreating(true);
    const { data, error: err } = await supabase
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
    if (err || !data) {
      setError("Failed to create collection.");
      return;
    }
    setCollections((prev) => [data, ...prev]);
    setSelectedId(data.id);
    setShowNewForm(false);
    setNewName("");
    setNewDesc("");
    setNewColor("blue");
  };

  const handleSave = async () => {
    if (!user || !selectedId) return;
    setSaving(true);
    setError("");
    const { error: err } = await supabase.from("saved_cases").insert({
      user_id: user.id,
      collection_id: selectedId,
      case_id: precedent.id,
      title: precedent.title,
      court: precedent.court,
      year: precedent.year,
      citation: precedent.citation,
      notes: notes.trim(),
    });
    setSaving(false);
    if (err) {
      if (err.code === "23505") {
        setError("This case is already saved in the selected collection.");
      } else {
        setError("Failed to save case. Please try again.");
      }
      return;
    }
    onSaved?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface shadow-xl animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-serif text-lg font-bold text-navy">Save Case</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-navy transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Case preview */}
          <div className="rounded-lg border border-border bg-background p-3.5">
            <p className="text-[13px] font-semibold text-navy line-clamp-2">{precedent.title}</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {precedent.court} · {precedent.year} · {precedent.citation}
            </p>
          </div>

          {/* Select collection */}
          <div>
            <label className="mb-2 block text-[13px] font-semibold text-navy">
              Save to Collection
            </label>

            {loading ? (
              <div className="py-6 text-center text-[13px] text-muted-foreground">
                Loading collections...
              </div>
            ) : collections.length === 0 && !showNewForm ? (
              <div className="rounded-xl border border-dashed border-border bg-background p-6 text-center">
                <FolderOpen className="mx-auto size-8 text-muted-foreground/40" />
                <p className="mt-2 text-[13px] text-muted-foreground">
                  No collections yet. Create one to get started.
                </p>
                <button
                  type="button"
                  onClick={() => setShowNewForm(true)}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-[13px] font-medium text-white hover:bg-navy/90"
                >
                  <FolderPlus className="size-4 text-saffron" />
                  Create Collection
                </button>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {collections.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setSelectedId(col.id)}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      selectedId === col.id
                        ? "bg-navy text-white"
                        : "bg-background text-navy hover:bg-accent"
                    }`}
                  >
                    <FolderOpen
                      className={`size-4 shrink-0 ${selectedId === col.id ? "text-saffron" : "text-brand-blue"}`}
                    />
                    <span className="text-[13px] font-medium truncate">{col.name}</span>
                  </button>
                ))}
              </div>
            )}

            {!showNewForm && collections.length > 0 && (
              <button
                type="button"
                onClick={() => setShowNewForm(true)}
                className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-brand-blue hover:text-navy hover:underline"
              >
                <FolderPlus className="size-3.5" />
                New Collection
              </button>
            )}
          </div>

          {/* Create new collection inline */}
          {showNewForm && (
            <div className="rounded-xl border border-brand-blue/20 bg-brand-blue/5 p-4 space-y-3">
              <p className="text-[13px] font-semibold text-navy">New Collection</p>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Client: Rahul Sharma"
                className="w-full rounded-lg border border-border bg-surface py-2 px-3 text-[13px] text-navy placeholder:text-muted-foreground/50 focus:border-brand-blue focus:outline-none"
                autoFocus
              />
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full rounded-lg border border-border bg-surface py-2 px-3 text-[13px] text-navy placeholder:text-muted-foreground/50 focus:border-brand-blue focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-muted-foreground">Color:</span>
                {COLLECTION_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setNewColor(c.id)}
                    className={`size-6 rounded-full ${c.className} border-2 transition-transform ${
                      newColor === c.id
                        ? "border-navy scale-110"
                        : "border-transparent hover:scale-105"
                    }`}
                    title={c.label}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCreateCollection}
                  disabled={creating || !newName.trim()}
                  className="rounded-lg bg-navy px-3 py-1.5 text-[12px] font-medium text-white hover:bg-navy/90 disabled:opacity-60"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewForm(false)}
                  className="rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:bg-accent"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-navy">
              <StickyNote className="size-3.5" />
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about why this case is relevant..."
              rows={3}
              className="w-full rounded-lg border border-border bg-background p-3 text-[13px] text-navy placeholder:text-muted-foreground/50 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 focus:outline-none resize-y"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-[13px] font-medium text-muted-foreground hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !selectedId}
            className="rounded-lg bg-navy px-5 py-2 text-[13px] font-semibold text-white shadow-md hover:bg-navy/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Saving..." : "Save Case"}
          </button>
        </div>
      </div>
    </div>
  );
}
