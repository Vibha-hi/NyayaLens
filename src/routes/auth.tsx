import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Scale, Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/legal/Navbar";
import { SiteFooter } from "@/components/legal/SiteFooter";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Nyayalens — Sign In" },
      {
        name: "description",
        content: "Sign in to your Nyayalens workspace to save and organize legal precedents.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Redirect if already logged in
  if (user) {
    navigate({ to: "/profile" });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        if (!name.trim()) {
          setError("Please enter your full name.");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError("Password must be at least 6 characters.");
          setLoading(false);
          return;
        }
        const result = await signUp(email, password, name.trim());
        if (result.error) {
          setError(result.error);
        } else {
          setSignupSuccess(true);
        }
      } else {
        const result = await signIn(email, password);
        if (result.error) {
          setError(result.error);
        }
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (signupSuccess) {
    return (
      <div className="flex min-h-screen flex-col bg-background selection:bg-brand-blue/20">
        <Navbar activeCategory="All" onSelectCategory={() => {}} />
        <main className="flex flex-1 items-center justify-center px-4 py-16">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <Mail className="size-8" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-navy">Check your email</h1>
            <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
              We've sent a confirmation link to <strong className="text-navy">{email}</strong>.
              Click the link in the email to activate your account, then come back and sign in.
            </p>
            <button
              type="button"
              onClick={() => {
                setSignupSuccess(false);
                setMode("signin");
                setPassword("");
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-navy px-6 py-3 text-[14px] font-semibold text-white shadow-md hover:bg-navy/90 transition-colors"
            >
              Back to Sign In
              <ArrowRight className="size-4 text-saffron" />
            </button>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-brand-blue/20">
      <Navbar activeCategory="All" onSelectCategory={() => {}} />

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-navy text-saffron shadow-lg">
              <Scale className="size-7" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-navy">
              {mode === "signin" ? "Welcome back" : "Create your workspace"}
            </h1>
            <p className="mt-2 text-[14px] text-muted-foreground">
              {mode === "signin"
                ? "Sign in to access your saved cases and collections."
                : "Set up your personalized legal research workspace."}
            </p>
          </div>

          {/* Form Card */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-subtle sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label
                    htmlFor="auth-name"
                    className="mb-1.5 block text-[13px] font-semibold text-navy"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="auth-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Adv. Priya Sharma"
                      className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-[14px] text-navy placeholder:text-muted-foreground/60 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="auth-email"
                  className="mb-1.5 block text-[13px] font-semibold text-navy"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-[14px] text-navy placeholder:text-muted-foreground/60 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="auth-password"
                  className="mb-1.5 block text-[13px] font-semibold text-navy"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "signup" ? "Min. 6 characters" : "Your password"}
                    className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-11 text-[14px] text-navy placeholder:text-muted-foreground/60 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 focus:outline-none"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-navy"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-navy py-3 text-[14px] font-semibold text-white shadow-md transition-all hover:bg-navy/90 hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Please wait..."
                  : mode === "signin"
                    ? "Sign In"
                    : "Create Account"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-[13px] text-muted-foreground">
                {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "signin" ? "signup" : "signin");
                    setError("");
                  }}
                  className="font-semibold text-brand-blue hover:text-navy hover:underline"
                >
                  {mode === "signin" ? "Sign Up" : "Sign In"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
