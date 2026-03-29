"use client";

import { useState, useCallback } from "react";
import { StoryForm } from "@/components/story-form";
import { StoryDisplay } from "@/components/story-display";
import type { StoryFormData } from "@/lib/validators";
import type { GenerationStatus } from "@/types/story";

export function StoryGenerator() {
  const [storyText, setStoryText] = useState("");
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = useCallback(async (data: StoryFormData) => {
    setStatus("generating");
    setStoryText("");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Request failed (${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response stream available");
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        setStoryText((prev) => prev + text);
      }

      setStatus("done");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong. Please try again."
      );
    }
  }, []);

  const handleNewStory = useCallback(() => {
    setStoryText("");
    setStatus("idle");
    setErrorMessage(null);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <StoryForm onSubmit={handleSubmit} isGenerating={status === "generating"} />

      {errorMessage && (
        <div className="mt-6 rounded-xl bg-red-50 border border-red-200 p-4 text-red-800">
          <p className="font-semibold">Oops!</p>
          <p className="text-sm mt-1">{errorMessage}</p>
          <button
            onClick={handleNewStory}
            className="mt-3 text-sm font-semibold text-red-700 hover:text-red-900 underline cursor-pointer"
          >
            Try again
          </button>
        </div>
      )}

      {storyText && (
        <StoryDisplay
          storyText={storyText}
          isStreaming={status === "generating"}
          onNewStory={handleNewStory}
        />
      )}
    </div>
  );
}
