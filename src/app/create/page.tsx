"use client";

import { StoryGenerator } from "@/components/story-generator";
import { SettingsPanel } from "@/components/settings-panel";
import { useLocale } from "@/contexts/locale-context";
import { t } from "@/lib/i18n";
import Link from "next/link";

function Stars() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <span className="absolute top-8 left-[10%] text-2xl animate-twinkle twinkle-delay-1">&#10022;</span>
      <span className="absolute top-14 right-[15%] text-lg animate-twinkle twinkle-delay-2 text-amber-400">&#10022;</span>
      <span className="absolute top-6 left-[45%] text-sm animate-twinkle twinkle-delay-3 text-violet-400">&#10022;</span>
      <span className="absolute top-20 right-[35%] text-xl animate-twinkle twinkle-delay-4 text-amber-300">&#10022;</span>
      <span className="absolute top-12 left-[75%] text-base animate-twinkle twinkle-delay-5">&#10022;</span>
    </div>
  );
}

export default function CreatePage() {
  const { locale } = useLocale();

  return (
    <div className="flex flex-col flex-1 items-center min-h-screen bg-[var(--color-background)]">
      <header className="relative w-full max-w-2xl mx-auto pt-10 pb-6 px-4 sm:px-6">
        <Stars />
        <div className="absolute top-4 right-4 sm:right-6 z-10">
          <SettingsPanel />
        </div>
        <div className="absolute top-4 left-4 sm:left-6 z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 w-10 h-10 justify-center rounded-full bg-[var(--color-surface)] border border-[var(--color-surface-border)] text-[var(--color-primary)] hover:bg-[var(--color-unselected-hover)] transition-all"
            aria-label="Back"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
        <div className="text-center">
          <div className="animate-float inline-block mb-2">
            <span className="text-5xl" role="img" aria-label="open book">📖</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[var(--color-primary)] tracking-tight">
            {t(locale, "appName")}
          </h1>
          <p className="mt-2 text-lg text-[var(--color-primary-light)] font-medium">
            {t(locale, "appTagline")}
          </p>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl px-4 sm:px-6 pb-16">
        <StoryGenerator />
      </main>

      <footer className="w-full py-6 text-center text-sm text-[var(--color-muted)]">
        {t(locale, "footer")}
      </footer>
    </div>
  );
}
