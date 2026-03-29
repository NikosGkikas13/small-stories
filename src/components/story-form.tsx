"use client";

import { useState } from "react";
import { storyFormSchema, type StoryFormData } from "@/lib/validators";
import type { StoryLength } from "@/types/story";

interface StoryFormProps {
  onSubmit: (data: StoryFormData) => void;
  isGenerating: boolean;
}

const AGE_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

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
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      {/* Child's Name */}
      <div>
        <label htmlFor="childName" className="block text-sm font-semibold text-gray-700 mb-1">
          Child&apos;s Name *
        </label>
        <input
          id="childName"
          type="text"
          value={childName}
          onChange={(e) => setChildName(e.target.value)}
          placeholder="e.g., Emma"
          disabled={isGenerating}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 focus:outline-none transition disabled:opacity-50"
        />
        {errors.childName && <p className="mt-1 text-sm text-red-600">{errors.childName}</p>}
      </div>

      {/* Age */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Age *</label>
        <div className="flex flex-wrap gap-2">
          {AGE_OPTIONS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAge(a)}
              disabled={isGenerating}
              className={`h-10 w-10 rounded-full text-sm font-semibold transition cursor-pointer ${
                age === a
                  ? "bg-violet-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-violet-100"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {a}
            </button>
          ))}
        </div>
        {errors.age && <p className="mt-1 text-sm text-red-600">{errors.age}</p>}
      </div>

      {/* Theme / Moral */}
      <div>
        <label htmlFor="theme" className="block text-sm font-semibold text-gray-700 mb-1">
          Story Theme or Moral *
        </label>
        <input
          id="theme"
          type="text"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder="e.g., kindness, sharing, being brave, friendship"
          disabled={isGenerating}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 focus:outline-none transition disabled:opacity-50"
        />
        {errors.theme && <p className="mt-1 text-sm text-red-600">{errors.theme}</p>}
      </div>

      {/* Optional: Character and Setting side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="character" className="block text-sm font-semibold text-gray-700 mb-1">
            Favorite Character
          </label>
          <input
            id="character"
            type="text"
            value={character}
            onChange={(e) => setCharacter(e.target.value)}
            placeholder="e.g., a talking fox"
            disabled={isGenerating}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 focus:outline-none transition disabled:opacity-50"
          />
        </div>
        <div>
          <label htmlFor="setting" className="block text-sm font-semibold text-gray-700 mb-1">
            Story Setting
          </label>
          <input
            id="setting"
            type="text"
            value={setting}
            onChange={(e) => setSetting(e.target.value)}
            placeholder="e.g., an enchanted forest"
            disabled={isGenerating}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 focus:outline-none transition disabled:opacity-50"
          />
        </div>
      </div>

      {/* Story Length */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Story Length</label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setLength("short")}
            disabled={isGenerating}
            className={`flex-1 rounded-xl py-3 text-sm font-semibold transition cursor-pointer ${
              length === "short"
                ? "bg-violet-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-violet-100"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Short (bedtime)
          </button>
          <button
            type="button"
            onClick={() => setLength("medium")}
            disabled={isGenerating}
            className={`flex-1 rounded-xl py-3 text-sm font-semibold transition cursor-pointer ${
              length === "medium"
                ? "bg-violet-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-violet-100"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Medium (read-along)
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isGenerating}
        className="w-full rounded-xl bg-violet-600 py-4 text-lg font-bold text-white hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Creating your story...
          </span>
        ) : (
          "Create Story"
        )}
      </button>
    </form>
  );
}
