"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import type { StoryFormData } from "@/lib/validators";

const WORDS_PER_PAGE = 120;

function parseStory(raw: string): { title: string; body: string } {
  const match = raw.match(/^TITLE:\s*(.+?)\n\n([\s\S]*)$/);
  if (match) return { title: match[1].trim(), body: match[2] };
  // Still streaming the first line
  if (raw.startsWith("TITLE:") && !raw.includes("\n\n")) {
    return { title: raw.replace(/^TITLE:\s*/, "").trim(), body: "" };
  }
  return { title: "", body: raw };
}

function splitIntoPages(text: string): string[] {
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim());
  if (paragraphs.length === 0) return [text];

  const pages: string[] = [];
  let currentPage = "";
  let currentWordCount = 0;

  for (const paragraph of paragraphs) {
    const paragraphWords = paragraph.trim().split(/\s+/).length;
    if (currentWordCount > 0 && currentWordCount + paragraphWords > WORDS_PER_PAGE) {
      pages.push(currentPage.trim());
      currentPage = paragraph;
      currentWordCount = paragraphWords;
    } else {
      currentPage += (currentPage ? "\n\n" : "") + paragraph;
      currentWordCount += paragraphWords;
    }
  }

  if (currentPage.trim()) pages.push(currentPage.trim());
  return pages.length > 0 ? pages : [text];
}

// Decorative ornaments for the cover
const COVER_ORNAMENTS = ["✦", "✧", "⋆", "✦", "✧", "⋆", "✦", "✧"];

export default function StoryPage() {
  const router = useRouter();
  const [rawText, setRawText] = useState("");
  const [isStreaming, setIsStreaming] = useState(true);
  const [isReading, setIsReading] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [childName, setChildName] = useState("");
  const [format, setFormat] = useState<"story" | "poem">("story");
  const hasStarted = useRef(false);

  const [currentPage, setCurrentPage] = useState(0);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [coverImageLoading, setCoverImageLoading] = useState(false);
  const imageRequested = useRef(false);

  // Cover state: "cover" → "exiting" → "open"
  const [coverState, setCoverState] = useState<"cover" | "exiting" | "open">("cover");

  const { title, body } = useMemo(() => parseStory(rawText), [rawText]);
  const pages = useMemo(() => splitIntoPages(body), [body]);
  const totalPages = pages.length;

  // Fetch cover image once story is done streaming and we have a title
  useEffect(() => {
    if (isStreaming || !title || imageRequested.current) return;
    imageRequested.current = true;

    const stored = sessionStorage.getItem("storyFormData");
    if (!stored) return;
    const data: StoryFormData = JSON.parse(stored);

    setCoverImageLoading(true);
    fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        childName: data.childName,
        theme: data.theme,
        setting: data.setting,
        character: data.character,
      }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.url) setCoverImageUrl(json.url);
      })
      .catch(() => {/* silently skip image on error */})
      .finally(() => setCoverImageLoading(false));
  }, [isStreaming, title]);

  useEffect(() => {
    setCanSpeak("speechSynthesis" in window);
  }, []);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const stored = sessionStorage.getItem("storyFormData");
    if (!stored) { router.replace("/"); return; }

    const data: StoryFormData = JSON.parse(stored);
    setChildName(data.childName);
    setFormat(data.format);

    async function generateStory() {
      try {
        const response = await fetch("/api/generate-story", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: stored,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || `Request failed (${response.status})`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream available");

        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          setRawText((prev) => prev + decoder.decode(value, { stream: true }));
        }
        setIsStreaming(false);
      } catch (err) {
        setIsStreaming(false);
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    }

    generateStory();
  }, [router]);

  const openBook = useCallback(() => {
    if (coverState !== "cover") return;
    setCoverState("exiting");
    setTimeout(() => setCoverState("open"), 420);
  }, [coverState]);

  const handleReadAloud = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    if (isReading) {
      window.speechSynthesis.cancel();
      setIsReading(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(body);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.onend = () => setIsReading(false);
    utterance.onerror = () => setIsReading(false);
    window.speechSynthesis.speak(utterance);
    setIsReading(true);
  }, [body, isReading]);

  const handleBack = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsReading(false);
    router.push("/");
  }, [router]);

  // ── Loading ──────────────────────────────────────────────
  if (!rawText && isStreaming && !error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-background)]">
        <div className="absolute top-4 right-4 z-10"><ThemeToggle /></div>
        <div className="text-center animate-fade-in-up">
          <span className="text-6xl animate-float inline-block">📖</span>
          <p className="mt-4 text-xl font-bold text-[var(--color-primary)]">
            Creating a {format} for {childName}...
          </p>
          <p className="mt-2 text-[var(--color-primary-light)]">Opening the book of imagination</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-background)] px-4">
        <div className="absolute top-4 right-4 z-10"><ThemeToggle /></div>
        <div className="max-w-md w-full rounded-2xl bg-[var(--color-error-bg)] border-2 border-[var(--color-error-border)] p-6 text-center animate-fade-in-up">
          <p className="text-4xl mb-3">😔</p>
          <p className="font-bold text-lg text-[var(--color-error-text)]">Oops!</p>
          <p className="text-sm mt-1 text-[var(--color-error-text-light)]">{error}</p>
          <button onClick={handleBack} className="mt-4 rounded-full bg-red-600 px-6 py-3 text-white font-bold hover:bg-red-700 transition-all cursor-pointer">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const showPagination = !isStreaming && totalPages > 1;

  // ── Cover ────────────────────────────────────────────────
  if (coverState !== "open") {
    const coverReady = !isStreaming && !!title && !coverImageLoading;
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-background)] px-4 py-8">
        <div className="absolute top-4 right-4 z-10"><ThemeToggle /></div>

        <div
          className={`w-full max-w-sm ${coverState === "exiting" ? "animate-cover-exit" : "animate-cover-reveal"}`}
        >
          {/* Book cover card */}
          <div
            className="relative rounded-3xl overflow-hidden shadow-2xl"
            style={{
              background: "linear-gradient(160deg, #4c1d95 0%, #6d28d9 40%, #7c3aed 70%, #5b21b6 100%)",
              border: "3px solid rgba(196, 181, 253, 0.4)",
              boxShadow: "0 30px 60px -15px rgba(109, 40, 217, 0.5), 0 0 0 1px rgba(196,181,253,0.1)",
            }}
          >
            {/* Scattered ornaments */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
              {COVER_ORNAMENTS.map((o, i) => (
                <span
                  key={i}
                  className="absolute text-purple-300/40 animate-twinkle"
                  style={{
                    fontSize: `${10 + (i % 3) * 6}px`,
                    top: `${8 + (i * 11) % 80}%`,
                    left: `${5 + (i * 17) % 88}%`,
                    animationDelay: `${i * 0.4}s`,
                  }}
                >
                  {o}
                </span>
              ))}
            </div>

            {/* Top border ornament */}
            <div className="relative pt-10 px-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="h-px flex-1 bg-purple-300/30" />
                <span className="text-purple-200/60 text-sm tracking-[0.3em]">✦ ✦ ✦</span>
                <div className="h-px flex-1 bg-purple-300/30" />
              </div>

              {/* Format badge */}
              <p className="text-purple-300/80 text-xs font-bold uppercase tracking-[0.25em] mb-6">
                {format === "poem" ? "A poem" : "A story"} for
              </p>

              {/* Child's name */}
              <p className="text-white/90 text-2xl font-bold mb-8" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.4)" }}>
                {childName}
              </p>

              {/* Divider */}
              <div className="w-12 h-0.5 mx-auto mb-8 rounded-full bg-purple-300/50" />

              {/* Cover image */}
              <div className="w-full aspect-square rounded-2xl overflow-hidden mb-6 relative"
                style={{ background: "rgba(0,0,0,0.2)" }}
              >
                {coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverImageUrl}
                    alt={title || "Story cover"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                    {coverImageLoading ? (
                      <>
                        <div className="w-10 h-10 rounded-full border-4 border-purple-300/30 border-t-purple-300 animate-spin" />
                        <p className="text-purple-300/60 text-xs font-medium">Painting the cover…</p>
                      </>
                    ) : (
                      <span className="text-6xl animate-float inline-block">🎨</span>
                    )}
                  </div>
                )}
              </div>

              {/* Title area */}
              <div className="min-h-[80px] flex items-center justify-center mb-8">
                {title ? (
                  <h1
                    className="text-white text-3xl sm:text-4xl font-bold leading-tight"
                    style={{
                      textShadow: "0 2px 20px rgba(0,0,0,0.5)",
                      fontVariant: "small-caps",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {title}
                  </h1>
                ) : (
                  <div className="flex gap-2 items-center">
                    <span className="w-2 h-2 rounded-full bg-purple-300/60 animate-blink" />
                    <span className="w-2 h-2 rounded-full bg-purple-300/60 animate-blink" style={{ animationDelay: "0.2s" }} />
                    <span className="w-2 h-2 rounded-full bg-purple-300/60 animate-blink" style={{ animationDelay: "0.4s" }} />
                  </div>
                )}
              </div>

              {/* Bottom ornament */}
              <div className="flex items-center justify-center gap-3 mb-8">
                <div className="h-px flex-1 bg-purple-300/30" />
                <span className="text-purple-200/60 text-sm">✦</span>
                <div className="h-px flex-1 bg-purple-300/30" />
              </div>
            </div>

            {/* Open button */}
            <div className="pb-10 px-8">
              <button
                onClick={openBook}
                disabled={!coverReady}
                className="w-full rounded-2xl py-4 font-bold text-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: coverReady
                    ? "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%)"
                    : "rgba(255,255,255,0.1)",
                  border: "1.5px solid rgba(255,255,255,0.3)",
                  color: "white",
                  backdropFilter: "blur(8px)",
                  boxShadow: coverReady ? "0 4px 24px rgba(0,0,0,0.2)" : "none",
                }}
              >
                {!isStreaming && title && coverImageLoading
                  ? "🎨  Painting the cover…"
                  : coverReady
                  ? "📖  Open Book"
                  : "Writing your story…"}
              </button>
            </div>

            {/* Spine shadow at the left */}
            <div
              className="absolute left-0 top-0 bottom-0 w-4 pointer-events-none"
              style={{ background: "linear-gradient(to right, rgba(0,0,0,0.25), transparent)" }}
              aria-hidden="true"
            />
          </div>

          {/* Back button below the cover */}
          <button
            onClick={handleBack}
            className="mt-6 mx-auto flex items-center gap-2 text-[var(--color-primary)] font-bold hover:text-violet-400 transition-colors cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            New Story
          </button>
        </div>
      </div>
    );
  }

  // ── Story pages ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--color-background)] px-4 py-8 sm:py-12">
      <div className="absolute top-4 right-4 z-10"><ThemeToggle /></div>

      <div className="max-w-2xl mx-auto mb-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-[var(--color-primary)] font-bold hover:text-violet-400 transition-colors cursor-pointer"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          New Story
        </button>
      </div>

      <div className="max-w-2xl mx-auto animate-book-open">
        {/* Title header */}
        <div className="text-center mb-2 animate-content-reveal">
          <p className="text-sm font-bold text-[var(--color-primary-light)] uppercase tracking-widest mb-1">
            A {format} for {childName}
          </p>
          {title && (
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-foreground)] mt-2">
              {title}
            </h1>
          )}
        </div>

        {/* Story card */}
        <div className="animate-content-reveal mt-6">
          <div
            className="relative rounded-3xl p-6 sm:p-10 shadow-xl"
            style={{
              background: `linear-gradient(to bottom right, var(--color-card-from), var(--color-card-to))`,
              border: `2px solid var(--color-card-border)`,
              boxShadow: `0 20px 40px -10px var(--color-shadow)`,
              minHeight: showPagination ? "300px" : undefined,
            }}
          >
            <div className="absolute top-4 left-5 text-lg select-none" style={{ color: "var(--color-card-accent)" }} aria-hidden="true">&#10022;</div>
            <div className="absolute top-4 right-5 text-lg select-none" style={{ color: "var(--color-card-accent)" }} aria-hidden="true">&#10022;</div>
            <div className="absolute bottom-4 left-5 text-lg select-none" style={{ color: "var(--color-card-accent)" }} aria-hidden="true">&#10022;</div>
            <div className="absolute bottom-4 right-5 text-lg select-none" style={{ color: "var(--color-card-accent)" }} aria-hidden="true">&#10022;</div>

            <div className="w-16 h-0.5 mx-auto mb-6 rounded-full" style={{ background: "var(--color-card-accent)" }} />

            <p className="whitespace-pre-wrap text-lg sm:text-xl leading-8 sm:leading-9 font-medium" style={{ color: "var(--color-card-text)" }}>
              {isStreaming ? body : pages[currentPage]}
              {isStreaming && (
                <span className="inline-block w-0.5 h-5 align-middle ml-0.5 animate-blink" style={{ background: "var(--color-card-cursor)" }} />
              )}
            </p>

            {!isStreaming && (
              <div className="w-16 h-0.5 mx-auto mt-6 rounded-full" style={{ background: "var(--color-card-accent)" }} />
            )}

            {/* "The End" — only on the last page once streaming is done */}
            {!isStreaming && (!showPagination || currentPage === totalPages - 1) && (
              <p
                className="text-center mt-5 text-base font-bold tracking-[0.2em] italic select-none"
                style={{ color: "var(--color-card-accent)" }}
              >
                ~ The End ~
              </p>
            )}

            {showPagination && (
              <p className="text-center mt-3 text-sm font-semibold tracking-widest select-none" style={{ color: "var(--color-card-accent)" }}>
                {currentPage + 1} · {totalPages}
              </p>
            )}
          </div>
        </div>

        {/* Pagination */}
        {showPagination && (
          <div className="mt-6 flex items-center justify-between max-w-xs mx-auto animate-fade-in-up">
            <button
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 0}
              className="flex items-center gap-1.5 rounded-full px-5 py-2.5 font-bold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-[var(--color-unselected-bg)] text-[var(--color-unselected-text)] border-2 border-[var(--color-unselected-border)] hover:bg-[var(--color-unselected-hover)] hover:border-[var(--color-unselected-hover-border)]"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Prev
            </button>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages - 1}
              className="flex items-center gap-1.5 rounded-full px-5 py-2.5 font-bold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-[var(--color-unselected-bg)] text-[var(--color-unselected-text)] border-2 border-[var(--color-unselected-border)] hover:bg-[var(--color-unselected-hover)] hover:border-[var(--color-unselected-hover-border)]"
            >
              Next
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}

        {/* Action buttons */}
        {!isStreaming && body && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-up">
            {canSpeak && (
              <button
                onClick={handleReadAloud}
                className={`rounded-full px-6 py-3 font-bold transition-all cursor-pointer ${
                  isReading
                    ? "bg-[var(--color-error-bg)] text-[var(--color-error-text-light)] border-2 border-[var(--color-error-border)]"
                    : "bg-[var(--color-read-bg)] text-[var(--color-read-text)] border-2 border-[var(--color-read-border)] hover:bg-[var(--color-read-hover)]"
                }`}
              >
                {isReading ? "⏹ Stop Reading" : "🔊 Read Aloud"}
              </button>
            )}
            <button
              onClick={handleBack}
              className="rounded-full bg-violet-600 px-6 py-3 text-white font-bold hover:bg-violet-500 transition-all cursor-pointer"
            >
              ✨ Create Another Story
            </button>
          </div>
        )}
      </div>

      <footer className="max-w-2xl mx-auto mt-12 text-center text-sm text-[var(--color-muted)]">
        Stories generated by AI. Always review content before sharing with children.
      </footer>
    </div>
  );
}
