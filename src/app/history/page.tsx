"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/contexts/locale-context";
import { t } from "@/lib/i18n";
import { SettingsPanel } from "@/components/settings-panel";
import type { Story } from "@/lib/supabase/stories";

export default function HistoryPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Delete this story? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/stories/${id}`, { method: "DELETE" });
      if (res.ok) {
        setStories((prev) => prev.filter((s) => s.id !== id));
      }
    } catch {
      // silently fail
    } finally {
      setDeletingId(null);
    }
  }, []);

  const handleReread = useCallback(
    (story: Story) => {
      // Store the story data so the story page can display it
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

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(locale === "el" ? "el-GR" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] px-4 py-8">
      <div className="absolute top-4 right-4 z-10">
        <SettingsPanel />
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-[var(--color-primary)] font-bold hover:text-violet-400 transition-colors cursor-pointer mb-4"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t(locale, "newStory")}
          </button>
          <h1 className="text-3xl font-extrabold text-[var(--color-primary)]">Story Library</h1>
          <p className="mt-1 text-[var(--color-primary-light)] font-medium">
            All the stories you&apos;ve created
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <span className="text-5xl inline-block animate-float">📚</span>
            <p className="mt-4 text-[var(--color-muted)] font-bold">Loading your stories...</p>
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
            <span className="text-5xl inline-block mb-4">📖</span>
            <p className="text-lg font-bold text-[var(--color-foreground)]">No stories yet</p>
            <p className="mt-1 text-[var(--color-muted)]">Create your first story and it will appear here!</p>
            <button
              onClick={() => router.push("/")}
              className="mt-6 rounded-xl bg-violet-600 px-6 py-3 text-white font-bold shadow-sm shadow-violet-300/20 hover:bg-violet-700 transition-all cursor-pointer"
            >
              Create a story
            </button>
          </div>
        )}

        {/* Story list */}
        {!loading && stories.length > 0 && (
          <div className="space-y-4">
            {stories.map((story) => (
              <div
                key={story.id}
                className="rounded-2xl border-2 border-[var(--color-surface-border)] bg-[var(--color-surface)] p-5 transition-all hover:shadow-lg hover:border-[var(--color-primary-light)]/30 cursor-pointer"
                onClick={() => handleReread(story)}
              >
                <div className="flex items-start gap-4">
                  {/* Cover thumbnail */}
                  <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    {story.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={story.cover_image_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">{story.format === "poem" ? "📜" : "📖"}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-[var(--color-foreground)] truncate">
                      {story.title}
                    </h2>
                    <p className="text-sm text-[var(--color-muted)] mt-0.5">
                      {story.format === "poem" ? "Poem" : "Story"} for <strong>{story.child_name}</strong> &middot; {formatDate(story.created_at)}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="inline-block rounded-full bg-[var(--color-chip-bg)] border border-[var(--color-chip-border)] text-[var(--color-chip-text)] text-xs font-bold px-2.5 py-0.5">
                        {story.theme}
                      </span>
                      <span className="inline-block rounded-full bg-[var(--color-chip-bg)] border border-[var(--color-chip-border)] text-[var(--color-chip-text)] text-xs font-bold px-2.5 py-0.5">
                        Age {story.age}
                      </span>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(story.id);
                    }}
                    disabled={deletingId === story.id}
                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer disabled:opacity-50"
                    title="Delete story"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
