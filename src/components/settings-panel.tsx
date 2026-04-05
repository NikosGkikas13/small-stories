"use client";

import { useState, useEffect, useRef } from "react";
import { useLocale } from "@/contexts/locale-context";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function SettingsPanel() {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  // Fetch current user
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null);
    });
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    sessionStorage.clear();
    router.push("/login");
    router.refresh();
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function toggleTheme() {
    const dark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", dark ? "dark" : "light");
    setIsDark(dark);
  }

  const btnBase =
    "px-3 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer border-2";
  const btnActive = "bg-violet-600 text-white border-violet-600";
  const btnInactive =
    "bg-[var(--color-unselected-bg)] text-[var(--color-unselected-text)] border-[var(--color-unselected-border)] hover:bg-[var(--color-unselected-hover)] hover:border-[var(--color-unselected-hover-border)]";

  return (
    <>
      {/* Gear button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t(locale, "settingsTitle")}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--color-surface)] border border-[var(--color-surface-border)] text-[var(--color-primary)] hover:bg-[var(--color-unselected-hover)] transition-all cursor-pointer"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {/* Full-screen modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div
            ref={panelRef}
            className="relative w-full max-w-xs rounded-3xl p-6 animate-fade-in-up"
            style={{
              background: "var(--color-background)",
              border: "2px solid var(--color-surface-border)",
              boxShadow: "0 24px 48px -12px rgba(0,0,0,0.35)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-base font-extrabold uppercase tracking-widest text-[var(--color-primary-light)]">
                {t(locale, "settingsTitle")}
              </p>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-unselected-bg)] transition-all cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Language */}
            <div className="mb-5">
              <p className="text-xs font-bold text-[var(--color-foreground)] mb-2.5 opacity-60 uppercase tracking-wider">
                {t(locale, "settingsLanguage")}
              </p>
              <div className="flex gap-2">
                <button className={`${btnBase} flex-1 ${locale === "en" ? btnActive : btnInactive}`} onClick={() => setLocale("en")}>
                  🇬🇧 English
                </button>
                <button className={`${btnBase} flex-1 ${locale === "el" ? btnActive : btnInactive}`} onClick={() => setLocale("el")}>
                  🇬🇷 Ελληνικά
                </button>
              </div>
            </div>

            {/* Theme */}
            <div>
              <p className="text-xs font-bold text-[var(--color-foreground)] mb-2.5 opacity-60 uppercase tracking-wider">
                {t(locale, "settingsTheme")}
              </p>
              <div className="flex gap-2">
                <button className={`${btnBase} flex-1 ${!isDark ? btnActive : btnInactive}`} onClick={() => { if (isDark) toggleTheme(); }}>
                  ☀️ {t(locale, "settingsLight")}
                </button>
                <button className={`${btnBase} flex-1 ${isDark ? btnActive : btnInactive}`} onClick={() => { if (!isDark) toggleTheme(); }}>
                  🌙 {t(locale, "settingsDark")}
                </button>
              </div>
            </div>

            {/* Account */}
            {userEmail && (
              <div className="mt-5 pt-5 border-t-2 border-[var(--color-surface-border)]">
                <p className="text-xs font-bold text-[var(--color-foreground)] mb-2.5 opacity-60 uppercase tracking-wider">
                  Account
                </p>
                <p className="text-sm text-[var(--color-muted)] mb-3 truncate">{userEmail}</p>
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="w-full rounded-xl border-2 border-red-300 bg-red-50 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-100 hover:border-red-400 transition-all cursor-pointer disabled:opacity-50 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/50"
                >
                  {signingOut ? "Signing out..." : "Sign out"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
