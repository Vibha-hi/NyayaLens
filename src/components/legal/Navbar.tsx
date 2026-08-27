import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Scale,
  Menu,
  X,
  Search,
  ChevronDown,
  FolderOpen,
  FolderPlus,
  UserCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ModeToggle } from "@/components/mode-toggle";
import { supabase } from "@/lib/supabase";

interface NavbarProps {
  activeCategory?: string;
  onSelectCategory?: (category: string) => void;
  onSearchFocus?: () => void;
}

interface Collection {
  id: string;
  name: string;
  description: string;
  color: string;
}

export function Navbar({ onSearchFocus }: NavbarProps) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const collectionsRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (collectionsRef.current && !collectionsRef.current.contains(event.target as Node)) {
        setCollectionsOpen(false);
      }
    }
    if (collectionsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [collectionsOpen]);

  // Fetch collections when dropdown opens (desktop or mobile)
  useEffect(() => {
    if ((!collectionsOpen && !mobileMenuOpen) || !user) return;
    const fetchCollections = async () => {
      setLoadingCollections(true);
      const { data } = await supabase
        .from("collections")
        .select("id, name, description, color")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setCollections(data ?? []);
      setLoadingCollections(false);
    };
    fetchCollections();
  }, [collectionsOpen, mobileMenuOpen, user]);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 glass-nav shadow-xs">
      <div className="mx-auto flex h-16 max-w-[1380px] items-center justify-between gap-4 px-4 sm:px-6">
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <a
            href="/"
            onClick={handleLogoClick}
            className="group flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-navy text-primary-foreground shadow-sm group-hover:bg-navy/90 transition-colors">
              <Scale className="size-5 text-saffron" aria-hidden="true" />
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-[17.5px] font-bold tracking-tight text-navy">
                  Nyayalens
                </span>
              </div>
              <p className="text-[11px] font-medium text-muted-foreground">
                Local Precedent Retrieval &amp; Analysis
              </p>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {/* Collections Dropdown */}
            <div className="relative" ref={collectionsRef}>
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    navigate({ to: "/auth" });
                  } else {
                    setCollectionsOpen((prev) => !prev);
                  }
                }}
                aria-expanded={collectionsOpen}
                aria-haspopup="true"
                id="collections-menu-button"
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-all ${
                  collectionsOpen
                    ? "bg-navy/8 text-navy font-semibold"
                    : "text-foreground/80 hover:bg-accent hover:text-navy"
                }`}
              >
                <FolderOpen className="size-4 text-brand-blue" />
                <span>Collections</span>
                <ChevronDown
                  className={`size-3.5 text-muted-foreground transition-transform duration-200 ${
                    collectionsOpen ? "rotate-180 text-navy" : ""
                  }`}
                />
              </button>

              {/* Collections Dropdown Menu */}
              {collectionsOpen && user && (
                <div className="absolute left-0 top-full mt-2 w-72 rounded-xl border border-border bg-surface p-2 animate-in fade-in-0 zoom-in-95 duration-150 z-50 shadow-md">
                  <div className="px-3 py-2 border-b border-border/60 mb-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      My Collections
                    </p>
                    <p className="text-[11.5px] text-muted-foreground/80 mt-0.5">
                      Saved case collections in your workspace
                    </p>
                  </div>

                  <div className="max-h-[320px] overflow-y-auto space-y-0.5 py-1">
                    {loadingCollections ? (
                      <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" />
                        <span className="text-[13px]">Loading…</span>
                      </div>
                    ) : collections.length === 0 ? (
                      <div className="py-6 text-center">
                        <FolderOpen className="mx-auto size-8 text-muted-foreground/30 mb-2" />
                        <p className="text-[13px] text-muted-foreground">No collections yet</p>
                        <p className="text-[11.5px] text-muted-foreground/60 mt-0.5">
                          Save cases from search to create one
                        </p>
                      </div>
                    ) : (
                      collections.map((col) => (
                        <Link
                          key={col.id}
                          to="/collection"
                          search={{ id: col.id }}
                          onClick={() => setCollectionsOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-navy/5 group"
                        >
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-blue/10 border border-brand-blue/20 group-hover:bg-brand-blue/15 transition-colors">
                            <FolderOpen className="size-4 text-brand-blue" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium text-navy">{col.name}</p>
                            {col.description && (
                              <p className="truncate text-[11px] text-muted-foreground">
                                {col.description}
                              </p>
                            )}
                          </div>
                        </Link>
                      ))
                    )}
                  </div>

                  {/* Footer: go to full workspace */}
                  <div className="mt-1 pt-1.5 border-t border-border/60">
                    <Link
                      to="/profile"
                      onClick={() => setCollectionsOpen(false)}
                      className="flex items-center justify-center gap-1.5 w-full py-1.5 text-[12px] font-medium text-brand-blue hover:text-navy hover:underline"
                    >
                      <FolderPlus className="size-3.5" />
                      Manage all collections
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {onSearchFocus && (
            <button
              type="button"
              onClick={onSearchFocus}
              className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-navy px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-navy/90 transition-colors"
            >
              <Search className="size-3.5 text-saffron" />
              <span>Describe Case</span>
            </button>
          )}

          {/* Auth: Profile avatar or Sign In */}
          {user ? (
            <Link
              to="/profile"
              className="flex size-9 items-center justify-center rounded-full bg-navy text-[12px] font-bold text-saffron shadow-sm hover:bg-navy/90 transition-colors"
              title="My Workspace"
            >
              {profile?.initials || user.email?.[0]?.toUpperCase() || "?"}
            </Link>
          ) : (
            <Link
              to="/auth"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-[13px] font-medium text-navy hover:bg-accent transition-colors"
            >
              <UserCircle className="size-4 text-brand-blue" />
              Sign In
            </Link>
          )}

          <ModeToggle />

          {/* Mobile hamburger toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle menu"
            className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-surface text-navy hover:bg-accent md:hidden"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-surface px-4 py-4 md:hidden animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-4">
            {/* Quick search button */}
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onSearchFocus) onSearchFocus();
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-navy p-2.5 text-[13px] font-medium text-primary-foreground"
              >
                <Search className="size-4 text-saffron" />
                <span>Search Cases</span>
              </button>
            </div>

            {/* Collections list in mobile */}
            {user ? (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-navy uppercase tracking-wider">
                    Collections
                  </span>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-[11.5px] font-medium text-brand-blue"
                  >
                    View all
                  </Link>
                </div>

                {loadingCollections ? (
                  <div className="flex items-center gap-2 py-3 text-muted-foreground text-[13px]">
                    <Loader2 className="size-4 animate-spin" />
                    Loading…
                  </div>
                ) : collections.length === 0 ? (
                  <p className="py-2 text-[13px] text-muted-foreground">No collections yet.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-1.5">
                    {collections.map((col) => (
                      <Link
                        key={col.id}
                        to="/collection"
                        search={{ id: col.id }}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg bg-background px-3.5 py-2.5 text-[13px] transition-colors hover:bg-accent"
                      >
                        <FolderOpen className="size-4 text-brand-blue shrink-0" />
                        <span className="truncate font-medium text-navy">{col.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-3.5 py-2.5 text-[13px] font-medium text-navy"
              >
                <UserCircle className="size-4 text-brand-blue" />
                Sign in to see collections
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
