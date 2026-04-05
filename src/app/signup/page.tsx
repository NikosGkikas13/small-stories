"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-[var(--color-background)] px-4">
        <div className="w-full max-w-sm text-center">
          <span className="text-5xl inline-block mb-4">✉️</span>
          <h1 className="text-2xl font-extrabold text-[var(--color-primary)] mb-2">
            Check your email
          </h1>
          <p className="text-[var(--color-muted)] mb-6">
            We sent a confirmation link to <strong className="text-[var(--color-foreground)]">{email}</strong>.
            Click it to activate your account.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-xl bg-violet-600 px-6 py-3 text-white font-bold shadow-sm shadow-violet-300/20 hover:bg-violet-700 transition-all"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-[var(--color-background)] px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-5xl inline-block mb-3 animate-float" role="img" aria-label="sparkles">✨</span>
          <h1 className="text-3xl font-extrabold text-[var(--color-primary)] tracking-tight">
            Create an account
          </h1>
          <p className="mt-1 text-[var(--color-primary-light)] font-medium">
            Start creating stories for your little one
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
              placeholder="At least 6 characters"
              required
              disabled={loading}
              className="w-full rounded-xl border-2 border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-4 py-3 text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:border-[var(--color-primary)] focus:bg-[var(--color-input-focus-bg)] focus:ring-2 focus:ring-violet-200/30 focus:outline-none transition-all disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-bold text-[var(--color-foreground)] mb-1.5">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
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
                Creating account...
              </span>
            ) : (
              "Sign up"
            )}
          </button>
        </form>

        {/* Footer link */}
        <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-[var(--color-primary)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
