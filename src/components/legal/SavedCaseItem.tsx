import { useState } from "react";
import { Trash2, FileText, Building2, Calendar, Edit3, Check, X } from "lucide-react";

interface SavedCaseItemProps {
  id: string;
  caseId: string;
  title: string;
  court: string;
  year: string;
  citation: string;
  notes: string;
  savedAt: string;
  onUpdateNotes: (id: string, notes: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

export function SavedCaseItem({
  id,
  title,
  court,
  year,
  citation,
  notes,
  savedAt,
  onUpdateNotes,
  onRemove,
}: SavedCaseItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(notes);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleSaveNotes = async () => {
    setSaving(true);
    await onUpdateNotes(id, editedNotes);
    setSaving(false);
    setIsEditing(false);
  };

  const handleRemove = async () => {
    if (!confirm("Remove this case from the collection?")) return;
    setRemoving(true);
    await onRemove(id);
  };

  return (
    <article className="rounded-xl border border-border bg-surface p-5 shadow-subtle transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-[15px] font-bold text-navy leading-snug line-clamp-2">
            {title}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Building2 className="size-3" />
              {court}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3" />
              {year}
            </span>
            {citation && (
              <span className="inline-flex items-center gap-1">
                <FileText className="size-3" />
                {citation}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleRemove}
          disabled={removing}
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
          title="Remove from collection"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {/* Notes section */}
      <div className="mt-4 rounded-lg border border-border bg-background p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Notes
          </span>
          {!isEditing && (
            <button
              type="button"
              onClick={() => {
                setEditedNotes(notes);
                setIsEditing(true);
              }}
              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium text-brand-blue hover:bg-brand-blue/5 transition-colors"
            >
              <Edit3 className="size-3" />
              Edit
            </button>
          )}
        </div>

        {isEditing ? (
          <div>
            <textarea
              value={editedNotes}
              onChange={(e) => setEditedNotes(e.target.value)}
              placeholder="Add your notes about this case..."
              rows={3}
              className="w-full rounded-md border border-border bg-surface p-2.5 text-[13px] text-navy placeholder:text-muted-foreground/50 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 focus:outline-none resize-y"
              autoFocus
            />
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={saving}
                className="inline-flex items-center gap-1 rounded-md bg-navy px-3 py-1.5 text-[12px] font-medium text-white hover:bg-navy/90 disabled:opacity-60"
              >
                <Check className="size-3" />
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditedNotes(notes);
                  setIsEditing(false);
                }}
                className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:bg-accent"
              >
                <X className="size-3" />
                Cancel
              </button>
            </div>
          </div>
        ) : notes ? (
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/80">
            {notes}
          </p>
        ) : (
          <p className="text-[13px] italic text-muted-foreground/60">
            No notes yet. Click Edit to add notes.
          </p>
        )}
      </div>

      <div className="mt-3 text-[11px] text-muted-foreground/60">
        Saved {new Date(savedAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </div>
    </article>
  );
}
