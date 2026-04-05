"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SettingsPanel } from "@/components/settings-panel";
import Link from "next/link";
import type { Story } from "@/lib/supabase/stories";

function BookCover({ story, onClick }: { story: Story; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col cursor-pointer transition-all hover:scale-105 hover:-translate-y-1 focus:outline-none"
      title={story.title}
    >
      {/* Book spine shadow */}
      <div
        className="absolute left-0 top-1 bottom-1 w-2 rounded-l-sm z-10 pointer-events-none"
        style={{
          background: "linear-gradient(to right, rgba(0,0,0,0.3), rgba(0,0,0,0.05))",
        }}
      />

      {/* Book body */}
      <div
        className="relative w-full aspect-[2/3] rounded-lg overflow-hidden shadow-lg group-hover:shadow-2xl transition-shadow"
        style={{
          background: story.cover_image_url
            ? undefined
            : "linear-gradient(160deg, #4c1d95 0%, #6d28d9 40%, #7c3aed 70%, #5b21b6 100%)",
          border: "2px solid rgba(196, 181, 253, 0.3)",
        }}
      >
        {story.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={story.cover_image_url}
            alt={story.title}
            className="w-full h-full object-cover"
          />
        ) : (
          /* Fallback cover design */
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
            {/* Ornament */}
            <div className="flex items-center gap-1.5 mb-3">
              <div className="h-px w-4 bg-purple-300/40" />
              <span className="text-purple-300/50 text-[8px]">✦</span>
              <div className="h-px w-4 bg-purple-300/40" />
            </div>

            {/* Title */}
            <p
              className="text-white text-xs sm:text-sm font-bold leading-tight line-clamp-3"
              style={{ textShadow: "0 1px 6px rgba(0,0,0,0.4)" }}
            >
              {story.title}
            </p>

            {/* Child name */}
            <div className="mt-auto mb-1">
              <div className="h-px w-6 mx-auto bg-purple-300/30 mb-2" />
              <p className="text-purple-200/60 text-[9px] font-bold uppercase tracking-wider">
                for {story.child_name}
              </p>
            </div>
          </div>
        )}

        {/* Overlay title on images */}
        {story.cover_image_url && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2.5 pt-8">
            <p className="text-white text-[11px] sm:text-xs font-bold leading-tight line-clamp-2 drop-shadow-md">
              {story.title}
            </p>
          </div>
        )}
      </div>

      {/* Book bottom edge (shelf shadow) */}
      <div
        className="h-1 mx-1 rounded-b-sm"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.15), transparent)",
        }}
      />
    </button>
  );
}

function Shelf({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mb-10">
      {/* Books on this shelf */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 sm:gap-5 px-2 pb-3">
        {children}
      </div>

      {/* Shelf plank */}
      <div
        className="relative h-3 rounded-md mx-[-4px]"
        style={{
          background: "linear-gradient(to bottom, var(--color-surface-border), var(--color-surface-border))",
          boxShadow: "0 4px 12px -2px rgba(0,0,0,0.15), 0 2px 4px -1px rgba(0,0,0,0.1)",
        }}
      />
      {/* Shelf bracket hints */}
      <div className="flex justify-between px-4 mt-0.5">
        <div className="w-3 h-2 rounded-b-sm" style={{ background: "var(--color-surface-border)" }} />
        <div className="w-3 h-2 rounded-b-sm" style={{ background: "var(--color-surface-border)" }} />
      </div>
    </div>
  );
}

const BOOKS_PER_SHELF_SM = 3;
const BOOKS_PER_SHELF_LG = 4;

export default function MyStoriesPage() {
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stories")
      .then((r) => {
        if (r.status === 401) {
          router.push("/login");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        if (Array.isArray(data)) setStories(data);
        else setError("Failed to load stories.");
      })
      .catch(() => setError("Failed to load stories."))
      .finally(() => setLoading(false));
  }, [router]);

  const handleOpenStory = useCallback(
    (story: Story) => {
      sessionStorage.setItem(
        "savedStory",
        JSON.stringify({
          title: story.title,
          content: story.content,
          coverImageUrl: story.cover_image_url,
          childName: story.child_name,
          format: story.format,
          gender: story.gender,
        })
      );
      router.push("/story?saved=true");
    },
    [router]
  );

  // Split stories into shelves (we use the larger count and let CSS grid handle responsiveness)
  const shelves: Story[][] = [];
  for (let i = 0; i < stories.length; i += BOOKS_PER_SHELF_LG) {
    shelves.push(stories.slice(i, i + BOOKS_PER_SHELF_LG));
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] px-4 py-8">
      <div className="absolute top-4 right-4 z-10">
        <SettingsPanel />
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-[var(--color-primary)] font-bold hover:text-violet-400 transition-colors cursor-pointer mb-4"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </Link>
          <h1 className="text-3xl font-extrabold text-[var(--color-primary)]">My Stories</h1>
          <p className="mt-1 text-[var(--color-primary-light)] font-medium">
            Your personal bookshelf
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <span className="text-5xl inline-block animate-float">📚</span>
            <p className="mt-4 text-[var(--color-muted)] font-bold">Loading your bookshelf...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border-2 border-[var(--color-error-border)] bg-[var(--color-error-bg)] px-4 py-3 text-sm font-medium text-[var(--color-error-text)]">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && stories.length === 0 && (
          <div className="text-center py-16">
            <Shelf>
              {/* Ghost books for empty shelf */}
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="aspect-[2/3] rounded-lg border-2 border-dashed border-[var(--color-surface-border)] flex items-center justify-center"
                >
                  <span className="text-3xl opacity-20">📖</span>
                </div>
              ))}
            </Shelf>
            <p className="text-lg font-bold text-[var(--color-foreground)]">Your shelf is empty</p>
            <p className="mt-1 text-[var(--color-muted)]">
              Create your first story and it will appear here!
            </p>
            <Link
              href="/create"
              className="inline-block mt-6 rounded-xl bg-violet-600 px-6 py-3 text-white font-bold shadow-sm shadow-violet-300/20 hover:bg-violet-700 transition-all"
            >
              Create a story
            </Link>
          </div>
        )}

        {/* Bookshelf */}
        {!loading && stories.length > 0 && (
          <div>
            {shelves.map((shelf, i) => (
              <Shelf key={i}>
                {shelf.map((story) => (
                  <BookCover
                    key={story.id}
                    story={story}
                    onClick={() => handleOpenStory(story)}
                  />
                ))}
              </Shelf>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
