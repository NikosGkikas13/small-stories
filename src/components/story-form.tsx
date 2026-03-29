"use client";

import { useState } from "react";
import { storyFormSchema, type StoryFormData } from "@/lib/validators";
import type { StoryLength } from "@/types/story";

interface StoryFormProps {
  onSubmit: (data: StoryFormData) => void;
  isGenerating: boolean;
}

const AGE_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const THEME_SUGGESTIONS = [
  "kindness",
  "sharing",
  "being brave",
  "friendship",
  "honesty",
  "trying new things",
];

const inputClass =
  "w-full rounded-xl border-2 border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-4 py-3 text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:border-[var(--color-primary)] focus:bg-[var(--color-input-focus-bg)] focus:ring-2 focus:ring-violet-200/30 focus:outline-none transition-all disabled:opacity-50";

export function StoryForm({ onSubmit, isGenerating }: StoryFormProps) {
  const [childName, setChildName] = useState("");
  const [age, setAge] = useState<number | null>(null);
  const [theme, setTheme] = useState("");
  const [character, setCharacter] = useState("");
  const [setting, setSetting] = useState("");
  const [length, setLength] = useState<StoryLength>("short");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const result = storyFormSchema.safeParse({
      childName: childName.trim(),
      age,
      theme: theme.trim(),
      character: character.trim() || undefined,
      setting: setting.trim() || undefined,
      length,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const [key, messages] of Object.entries(result.error.flatten().fieldErrors)) {
        if (messages && messages.length > 0) {
          fieldErrors[key] = messages[0];
        }
      }
      setErrors(fieldErrors);
      return;
    }

    onSubmit(result.data);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full space-y-5 rounded-3xl bg-[var(--color-surface)] backdrop-blur-sm border border-[var(--color-surface-border)] shadow-lg p-6 sm:p-8"
      style={{ boxShadow: `0 10px 25px -5px var(--color-shadow)` }}
    >
      {/* Child's Name */}
      <div>
        <label htmlFor="childName" className="block text-sm font-bold text-[var(--color-foreground)] mb-1.5">
          Child&apos;s Name <span className="text-amber-500">*</span>
        </label>
        <input
          id="childName"
          type="text"
          value={childName}
          onChange={(e) => setChildName(e.target.value)}
          placeholder="e.g., Emma"
          disabled={isGenerating}
          className={inputClass}
        />
        {errors.childName && <p className="mt-1.5 text-sm text-red-500 font-medium">{errors.childName}</p>}
      </div>

      {/* Age */}
      <div>
        <label htmlFor="age" className="block text-sm font-bold text-[var(--color-foreground)] mb-1.5">
          Age <span className="text-amber-500">*</span>
        </label>
        <select
          id="age"
          value={age ?? ""}
          onChange={(e) => setAge(e.target.value ? Number(e.target.value) : null)}
          disabled={isGenerating}
          className={`${inputClass} font-bold appearance-none cursor-pointer ${
            age ? "" : "text-[var(--color-muted)]"
          }`}
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%237c3aed' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center' }}
        >
          <option value="" disabled>Select age</option>
          {AGE_OPTIONS.map((a) => (
            <option key={a} value={a}>
              {a} years old
            </option>
          ))}
        </select>
        {errors.age && <p className="mt-1.5 text-sm text-red-500 font-medium">{errors.age}</p>}
      </div>

      {/* Theme / Moral */}
      <div>
        <label htmlFor="theme" className="block text-sm font-bold text-[var(--color-foreground)] mb-1.5">
          Story Theme or Moral <span className="text-amber-500">*</span>
        </label>
        <input
          id="theme"
          type="text"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder="What should the story be about?"
          disabled={isGenerating}
          className={inputClass}
        />
        {/* Theme suggestion chips */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {THEME_SUGGESTIONS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              disabled={isGenerating}
              className="text-xs px-3 py-1 rounded-full bg-[var(--color-chip-bg)] text-[var(--color-chip-text)] border border-[var(--color-chip-border)] hover:bg-[var(--color-chip-hover)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {t}
            </button>
          ))}
        </div>
        {errors.theme && <p className="mt-1.5 text-sm text-red-500 font-medium">{errors.theme}</p>}
      </div>

      {/* Optional: Character and Setting */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="character" className="block text-sm font-bold text-[var(--color-foreground)] mb-1.5">
            Favorite Character
          </label>
          <input
            id="character"
            type="text"
            value={character}
            onChange={(e) => setCharacter(e.target.value)}
            placeholder="e.g., a talking fox"
            disabled={isGenerating}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="setting" className="block text-sm font-bold text-[var(--color-foreground)] mb-1.5">
            Story Setting
          </label>
          <input
            id="setting"
            type="text"
            value={setting}
            onChange={(e) => setSetting(e.target.value)}
            placeholder="e.g., an enchanted forest"
            disabled={isGenerating}
            className={inputClass}
          />
        </div>
      </div>

      {/* Story Length */}
      <div>
        <label className="block text-sm font-bold text-[var(--color-foreground)] mb-2">Story Length</label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setLength("short")}
            disabled={isGenerating}
            className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all cursor-pointer ${
              length === "short"
                ? "bg-violet-600 text-white shadow-lg shadow-violet-300/50 border-2 border-violet-600"
                : "bg-[var(--color-unselected-bg)] text-[var(--color-unselected-text)] hover:bg-[var(--color-unselected-hover)] border-2 border-[var(--color-unselected-border)]"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {"\u{1F319}"} Short (bedtime)
          </button>
          <button
            type="button"
            onClick={() => setLength("medium")}
            disabled={isGenerating}
            className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all cursor-pointer ${
              length === "medium"
                ? "bg-violet-600 text-white shadow-lg shadow-violet-300/50 border-2 border-violet-600"
                : "bg-[var(--color-unselected-bg)] text-[var(--color-unselected-text)] hover:bg-[var(--color-unselected-hover)] border-2 border-[var(--color-unselected-border)]"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {"\u{1F4DA}"} Medium (read-along)
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isGenerating}
        className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 py-4 text-lg font-extrabold text-white hover:from-violet-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-violet-200/50 hover:shadow-xl hover:shadow-violet-300/50 active:scale-[0.98]"
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin-slow inline-block">&#10024;</span>
            Creating your story...
          </span>
        ) : (
          <span>&#10024; Create Story</span>
        )}
      </button>
    </form>
  );
}
