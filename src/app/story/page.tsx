"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SettingsPanel } from "@/components/settings-panel";
import { VoiceRecorder } from "@/components/voice-recorder";
import { useLocale } from "@/contexts/locale-context";
import { t } from "@/lib/i18n";
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

// Set to true to skip API calls and use mock data for testing
const USE_MOCK = true;

// Default ElevenLabs voices by gender
const VOICE_BOY = "qQfU5YYBVdiZOXa4SQhO";  // Sam – Gentle Bedtime Story Narrator
const VOICE_GIRL = "8quEMRkSpwEaWBzHvTLv";

const MOCK_STORY = `TITLE: The Brave Little Star

Once upon a time, in a sky full of twinkling lights, there lived a tiny star named Lumi. Lumi was the smallest star in the whole night sky, and sometimes that made her feel a little sad.

"I wish I were as big and bright as the moon," Lumi whispered one evening.

The wise old owl who lived in the oak tree below heard her tiny voice. "Dear Lumi," he hooted gently, "being small doesn't mean you aren't important. Even the smallest light can guide someone home."

That very night, a little girl named Emma was walking through the forest with her grandmother. The path was dark, and the tall trees blocked the moonlight. Emma felt scared and held her grandmother's hand tightly.

Then Emma looked up and saw Lumi — a small but steady light peeking through the branches. "Look, Grandma! A little star is showing us the way!" Emma said with a smile.

Lumi glowed with all her might, lighting the path through the trees. Step by step, Emma and her grandmother followed the little star until they reached their cozy cottage.

"Thank you, little star!" Emma called out, waving goodnight.

From that night on, Lumi never wished to be bigger. She knew that even the smallest light can make the biggest difference when someone needs it most.`;

const MOCK_IMAGE = "https://placehold.co/1024x1024/7c3aed/white?text=Story+Cover";

// Decorative ornaments for the cover
const COVER_ORNAMENTS = ["✦", "✧", "⋆", "✦", "✧", "⋆", "✦", "✧"];

export default function StoryPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const [rawText, setRawText] = useState("");
  const [isStreaming, setIsStreaming] = useState(true);
  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const audioPauseable = useRef(false);
  const activeVoiceRef = useRef<"default" | "cloned" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [childName, setChildName] = useState("");
  const [format, setFormat] = useState<"story" | "poem">("story");
  const hasStarted = useRef(false);

  const [currentPage, setCurrentPage] = useState(0);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [coverImageLoading, setCoverImageLoading] = useState(false);
  const imageRequested = useRef(false);

  // Voice cloning
  const [clonedVoiceId, setClonedVoiceId] = useState<string | null>(null);
  const [gender, setGender] = useState<"boy" | "girl">("boy");
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cover state: "cover" → "exiting" → "open"
  const [coverState, setCoverState] = useState<"cover" | "exiting" | "open">("cover");

  const { title, body } = useMemo(() => parseStory(rawText), [rawText]);
  const pages = useMemo(() => splitIntoPages(body), [body]);
  const totalPages = pages.length;

  // Fetch cover image once story is done streaming and we have a title
  useEffect(() => {
    if (isStreaming || !title || imageRequested.current) return;
    imageRequested.current = true;

    if (USE_MOCK) {
      setCoverImageUrl(MOCK_IMAGE);
      return;
    }

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
    const savedVoiceId = localStorage.getItem("clonedVoiceId");
    if (savedVoiceId) setClonedVoiceId(savedVoiceId);
  }, []);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    if (USE_MOCK) {
      setChildName("Emma");
      setFormat("story");
      setGender("girl");
      setRawText(MOCK_STORY);
      setIsStreaming(false);
      return;
    }

    const stored = sessionStorage.getItem("storyFormData");
    if (!stored) { router.replace("/"); return; }

    const data: StoryFormData = JSON.parse(stored);
    setChildName(data.childName);
    setFormat(data.format);
    setGender(data.gender);

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

  async function playWithElevenLabs(voiceId: string, voiceType: "default" | "cloned") {
    setIsVoiceLoading(true);
    try {
      const res = await fetch("/api/read-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: body, voiceId }),
      });
      if (!res.ok) throw new Error("TTS failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setIsReading(false);
        setIsPaused(false);
        audioPauseable.current = false;
        activeVoiceRef.current = null;
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setIsReading(false);
        setIsPaused(false);
        audioPauseable.current = false;
        activeVoiceRef.current = null;
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };

      audio.play().then(() => {
        audioPauseable.current = true;
        activeVoiceRef.current = voiceType;
        setIsReading(true);
        setIsVoiceLoading(false);
      }).catch(() => {
        setIsReading(false);
        setIsVoiceLoading(false);
      });
    } catch {
      setIsReading(false);
      setIsVoiceLoading(false);
    }
  }

  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsReading(false);
    setIsPaused(false);
    audioPauseable.current = false;
    activeVoiceRef.current = null;
  }

  function handleVoiceButton(voiceType: "default" | "cloned") {
    const voiceId = voiceType === "cloned"
      ? clonedVoiceId!
      : (gender === "girl" ? VOICE_GIRL : VOICE_BOY);

    // Resume if paused with same voice
    if (isPaused && audioRef.current && audioPauseable.current && activeVoiceRef.current === voiceType) {
      audioRef.current.play().then(() => {
        setIsReading(true);
        setIsPaused(false);
      }).catch(() => {
        stopAudio();
        playWithElevenLabs(voiceId, voiceType);
      });
      return;
    }

    // Pause if playing with same voice
    if (isReading && audioRef.current && activeVoiceRef.current === voiceType) {
      audioRef.current.pause();
      setIsReading(false);
      setIsPaused(true);
      return;
    }

    // Different voice or fresh start — stop current and start new
    stopAudio();
    playWithElevenLabs(voiceId, voiceType);
  }

  const handleBack = useCallback(() => {
    stopAudio();
    router.push("/");
  }, [router]);

  const handleVoiceCloned = useCallback((voiceId: string) => {
    setClonedVoiceId(voiceId);
  }, []);

  const handleClearVoice = useCallback(() => {
    stopAudio();
    setClonedVoiceId(null);
    localStorage.removeItem("clonedVoiceId");
  }, []);

  // ── Loading ──────────────────────────────────────────────
  if (!rawText && isStreaming && !error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-background)]">
        <div className="absolute top-4 right-4 z-10"><SettingsPanel /></div>
        <div className="text-center animate-fade-in-up">
          <span className="text-6xl animate-float inline-block">📖</span>
          <p className="mt-4 text-xl font-bold text-[var(--color-primary)]">
            {format === "poem" ? t(locale, "creatingPoem") : t(locale, "creatingStory")} {childName}...
          </p>
          <p className="mt-2 text-[var(--color-primary-light)]">{t(locale, "openingBook")}</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-background)] px-4">
        <div className="absolute top-4 right-4 z-10"><SettingsPanel /></div>
        <div className="max-w-md w-full rounded-2xl bg-[var(--color-error-bg)] border-2 border-[var(--color-error-border)] p-6 text-center animate-fade-in-up">
          <p className="text-4xl mb-3">😔</p>
          <p className="font-bold text-lg text-[var(--color-error-text)]">{t(locale, "errorOops")}</p>
          <p className="text-sm mt-1 text-[var(--color-error-text-light)]">{error}</p>
          <button onClick={handleBack} className="mt-4 rounded-full bg-red-600 px-6 py-3 text-white font-bold hover:bg-red-700 transition-all cursor-pointer">
            {t(locale, "errorBack")}
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
        <div className="absolute top-4 right-4 z-10"><SettingsPanel /></div>

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
                {format === "poem" ? t(locale, "poemFor") : t(locale, "storyFor")}
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
                        <p className="text-purple-300/60 text-xs font-medium">{t(locale, "paintingCover")}</p>
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
                  ? t(locale, "paintingCover")
                  : coverReady
                  ? t(locale, "openBook")
                  : t(locale, "writingStory")}
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
            {t(locale, "newStory")}
          </button>
        </div>
      </div>
    );
  }

  // ── Story pages ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--color-background)] px-4 py-8 sm:py-12">
      <div className="absolute top-4 right-4 z-10"><SettingsPanel /></div>

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
            {format === "poem" ? t(locale, "poemFor") : t(locale, "storyFor")} {childName}
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
                {t(locale, "theEnd")}
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
              {t(locale, "prev")}
            </button>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages - 1}
              className="flex items-center gap-1.5 rounded-full px-5 py-2.5 font-bold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-[var(--color-unselected-bg)] text-[var(--color-unselected-text)] border-2 border-[var(--color-unselected-border)] hover:bg-[var(--color-unselected-hover)] hover:border-[var(--color-unselected-hover-border)]"
            >
              {t(locale, "next")}
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}

        {/* Voice recorder */}
        {!isStreaming && body && (
          <div className="mt-6 animate-fade-in-up">
            <VoiceRecorder
              onVoiceCloned={handleVoiceCloned}
              existingVoiceId={clonedVoiceId}
              onClearVoice={handleClearVoice}
            />
          </div>
        )}

        {/* Action buttons */}
        {!isStreaming && body && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-up">
            {/* Default voice button */}
            <button
              onClick={() => handleVoiceButton("default")}
              disabled={isVoiceLoading}
              className={`rounded-full px-6 py-3 font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                (isReading || isPaused) && activeVoiceRef.current === "default"
                  ? "bg-[var(--color-error-bg)] text-[var(--color-error-text-light)] border-2 border-[var(--color-error-border)]"
                  : "bg-[var(--color-read-bg)] text-[var(--color-read-text)] border-2 border-[var(--color-read-border)] hover:bg-[var(--color-read-hover)]"
              }`}
            >
              {isVoiceLoading && activeVoiceRef.current === "default"
                ? t(locale, "voiceLoading")
                : isReading && activeVoiceRef.current === "default"
                ? t(locale, "pauseReading")
                : isPaused && activeVoiceRef.current === "default"
                ? t(locale, "resumeReading")
                : t(locale, "readAloud")}
            </button>
            {/* Cloned voice button */}
            {clonedVoiceId && (
              <button
                onClick={() => handleVoiceButton("cloned")}
                disabled={isVoiceLoading}
                className={`rounded-full px-6 py-3 font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  (isReading || isPaused) && activeVoiceRef.current === "cloned"
                    ? "bg-[var(--color-error-bg)] text-[var(--color-error-text-light)] border-2 border-[var(--color-error-border)]"
                    : "bg-[var(--color-read-bg)] text-[var(--color-read-text)] border-2 border-[var(--color-read-border)] hover:bg-[var(--color-read-hover)]"
                }`}
              >
                {isVoiceLoading && activeVoiceRef.current === "cloned"
                  ? t(locale, "voiceLoading")
                  : isReading && activeVoiceRef.current === "cloned"
                  ? t(locale, "pauseReading")
                  : isPaused && activeVoiceRef.current === "cloned"
                  ? t(locale, "resumeReading")
                  : t(locale, "voiceReadAloud")}
              </button>
            )}
            <button
              onClick={handleBack}
              className="rounded-full bg-violet-600 px-6 py-3 text-white font-bold hover:bg-violet-500 transition-all cursor-pointer"
            >
              {t(locale, "createAnother")}
            </button>
          </div>
        )}
      </div>

      <footer className="max-w-2xl mx-auto mt-12 text-center text-sm text-[var(--color-muted)]">
        {t(locale, "footer")}
      </footer>
    </div>
  );
}
