"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { StoryForm } from "@/components/story-form";
import type { StoryFormData } from "@/lib/validators";

export function StoryGenerator() {
  const router = useRouter();

  const handleSubmit = useCallback(
    (data: StoryFormData) => {
      sessionStorage.setItem("storyFormData", JSON.stringify(data));
      router.push("/story");
    },
    [router]
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      <StoryForm onSubmit={handleSubmit} isGenerating={false} />
    </div>
  );
}
