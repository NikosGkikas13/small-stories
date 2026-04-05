"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-[var(--color-background)] px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-5xl inline-block mb-3 animate-float" role="img" aria-label="open book">📖</span>
          <h1 className="text-3xl font-extrabold text-[var(--color-primary)] tracking-tight">
            Welcome back
          </h1>
          <p className="mt-1 text-[var(--color-primary-light)] font-medium">
            Sign in to your account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl border-2 border-[var(--color-error-border)] bg-[var(--color-error-bg)] px-4 py-3 text-sm font-medium text-[var(--color-error-text)]">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-bold text-[var(--color-foreground)] mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading}
              className="w-full rounded-xl border-2 border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-4 py-3 text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:border-[var(--color-primary)] focus:bg-[var(--color-input-focus-bg)] focus:ring-2 focus:ring-violet-200/30 focus:outline-none transition-all disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-bold text-[var(--color-foreground)] mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
              disabled={loading}
              className="w-full rounded-xl border-2 border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-4 py-3 text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:border-[var(--color-primary)] focus:bg-[var(--color-input-focus-bg)] focus:ring-2 focus:ring-violet-200/30 focus:outline-none transition-all disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-violet-600 py-3 text-white font-bold text-base shadow-sm shadow-violet-300/20 hover:bg-violet-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
                Signing in...
              </span>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        {/* Footer link */}
        <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-bold text-[var(--color-primary)] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
