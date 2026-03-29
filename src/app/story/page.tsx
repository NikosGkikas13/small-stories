"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import type { StoryFormData } from "@/lib/validators";

export default function StoryPage() {
  const router = useRouter();
  const [storyText, setStoryText] = useState("");
  const [isStreaming, setIsStreaming] = useState(true);
  const [isReading, setIsReading] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [childName, setChildName] = useState("");
  const hasStarted = useRef(false);

  useEffect(() => {
    setCanSpeak("speechSynthesis" in window);
  }, []);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const stored = sessionStorage.getItem("storyFormData");
    if (!stored) {
      router.replace("/");
      return;
    }

    const data: StoryFormData = JSON.parse(stored);
    setChildName(data.childName);

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
          const text = decoder.decode(value, { stream: true });
          setStoryText((prev) => prev + text);
        }

        setIsStreaming(false);
      } catch (err) {
        setIsStreaming(false);
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    }

    generateStory();
  }, [router]);

  const handleReadAloud = useCallback(() => {
    if (!("speechSynthesis" in window)) return;

    if (isReading) {
      window.speechSynthesis.cancel();
      setIsReading(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(storyText);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.onend = () => setIsReading(false);
    utterance.onerror = () => setIsReading(false);

    window.speechSynthesis.speak(utterance);
    setIsReading(true);
  }, [storyText, isReading]);

  const handleBack = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsReading(false);
    router.push("/");
  }, [router]);

  // Loading state before story starts
  if (!storyText && isStreaming && !error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-background)]">
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>
        <div className="text-center animate-fade-in-up">
          <span className="text-6xl animate-float inline-block">{"\u{1F4D6}"}</span>
          <p className="mt-4 text-xl font-bold text-[var(--color-primary)]">
            Creating a story for {childName}...
          </p>
          <p className="mt-2 text-[var(--color-primary-light)]">
            Opening the book of imagination
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-background)] px-4">
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>
        <div className="max-w-md w-full rounded-2xl bg-[var(--color-error-bg)] border-2 border-[var(--color-error-border)] p-6 text-center animate-fade-in-up">
          <p className="text-4xl mb-3">{"\u{1F614}"}</p>
          <p className="font-bold text-lg text-[var(--color-error-text)]">Oops!</p>
          <p className="text-sm mt-1 text-[var(--color-error-text-light)]">{error}</p>
          <button
            onClick={handleBack}
            className="mt-4 rounded-full bg-red-600 px-6 py-3 text-white font-bold hover:bg-red-700 transition-all cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] px-4 py-8 sm:py-12">
      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Back button */}
      <div className="max-w-2xl mx-auto mb-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-[var(--color-primary)] font-bold hover:text-violet-400 transition-colors cursor-pointer"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          New Story
        </button>
      </div>

      {/* Book container */}
      <div className="max-w-2xl mx-auto animate-book-open">
        {/* Story header */}
        <div className="text-center mb-6 animate-content-reveal">
          <p className="text-sm font-bold text-[var(--color-primary-light)] uppercase tracking-widest">
            A story for {childName}
          </p>
        </div>

        {/* Story card */}
        <div
          className="relative rounded-3xl p-6 sm:p-10 shadow-xl animate-content-reveal"
          style={{
            background: `linear-gradient(to bottom right, var(--color-card-from), var(--color-card-to))`,
            border: `2px solid var(--color-card-border)`,
            boxShadow: `0 20px 40px -10px var(--color-shadow)`,
          }}
        >
          {/* Decorative corners */}
          <div className="absolute top-4 left-5 text-lg" style={{ color: 'var(--color-card-accent)' }} aria-hidden="true">&#10022;</div>
          <div className="absolute top-4 right-5 text-lg" style={{ color: 'var(--color-card-accent)' }} aria-hidden="true">&#10022;</div>
          <div className="absolute bottom-4 left-5 text-lg" style={{ color: 'var(--color-card-accent)' }} aria-hidden="true">&#10022;</div>
          <div className="absolute bottom-4 right-5 text-lg" style={{ color: 'var(--color-card-accent)' }} aria-hidden="true">&#10022;</div>

          {/* Decorative line */}
          <div className="w-16 h-0.5 mx-auto mb-6 rounded-full" style={{ background: 'var(--color-card-accent)' }} />

          <p className="whitespace-pre-wrap text-lg sm:text-xl leading-8 sm:leading-9 font-medium" style={{ color: 'var(--color-card-text)' }}>
            {storyText}
            {isStreaming && (
              <span className="inline-block w-0.5 h-5 align-middle ml-0.5 animate-blink" style={{ background: 'var(--color-card-cursor)' }} />
            )}
          </p>

          {/* Bottom decorative line */}
          {!isStreaming && (
            <div className="w-16 h-0.5 mx-auto mt-6 rounded-full" style={{ background: 'var(--color-card-accent)' }} />
          )}
        </div>

        {/* Action buttons */}
        {!isStreaming && storyText && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-up">
            {canSpeak && (
              <button
                onClick={handleReadAloud}
                className={`rounded-full px-6 py-3 font-bold transition-all cursor-pointer shadow-md ${
                  isReading
                    ? "bg-[var(--color-error-bg)] text-[var(--color-error-text-light)] border-2 border-[var(--color-error-border)]"
                    : "bg-[var(--color-read-bg)] text-[var(--color-read-text)] border-2 border-[var(--color-read-border)] hover:bg-[var(--color-read-hover)]"
                }`}
              >
                {isReading ? "\u23F9 Stop Reading" : "\u{1F50A} Read Aloud"}
              </button>
            )}
            <button
              onClick={handleBack}
              className="rounded-full bg-violet-600 px-6 py-3 text-white font-bold hover:bg-violet-700 transition-all cursor-pointer shadow-lg shadow-violet-300/30 hover:shadow-xl"
            >
              &#10024; Create Another Story
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="max-w-2xl mx-auto mt-12 text-center text-sm text-[var(--color-muted)]">
        Stories generated by AI. Always review content before sharing with children.
      </footer>
    </div>
  );
}
