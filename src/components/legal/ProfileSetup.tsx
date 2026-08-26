import { useState } from "react";
import { User, Briefcase, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function ProfileSetup() {
  const { profile, updateProfile } = useAuth();
  const [name, setName] = useState(profile?.name ?? "");
  const [specialization, setSpecialization] = useState(profile?.specialization ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const result = await updateProfile({
      name: name.trim(),
      specialization: specialization.trim(),
    });
    setSaving(false);
    if (!result.error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-subtle sm:p-8">
      <div className="mb-6">
        <h2 className="font-serif text-xl font-bold text-navy">Complete Your Profile</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Tell us a bit about yourself to personalize your workspace.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label htmlFor="profile-name" className="mb-1.5 block text-[13px] font-semibold text-navy">
            Full Name
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Adv. Priya Sharma"
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-[14px] text-navy placeholder:text-muted-foreground/60 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 focus:outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="profile-spec"
            className="mb-1.5 block text-[13px] font-semibold text-navy"
          >
            Specialization
          </label>
          <div className="relative">
            <Briefcase className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="profile-spec"
              type="text"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="Criminal Law, Bail Matters"
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-[14px] text-navy placeholder:text-muted-foreground/60 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-[13px] font-semibold text-white shadow-md transition-all hover:bg-navy/90 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Save className="size-4 text-saffron" />
          {saving ? "Saving..." : saved ? "Saved ✓" : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
