"use client";

interface StoryDisplayProps {
  storyText: string;
  isStreaming: boolean;
  onNewStory: () => void;
}

export function StoryDisplay({ storyText, isStreaming, onNewStory }: StoryDisplayProps) {
  return (
    <div className="mt-8 w-full">
      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-6 sm:p-8 shadow-sm">
        <p className="whitespace-pre-wrap text-lg leading-relaxed text-amber-950">
          {storyText}
          {isStreaming && (
            <span className="inline-block w-0.5 h-5 bg-amber-700 align-middle ml-0.5 animate-blink" />
          )}
        </p>
      </div>

      {!isStreaming && storyText && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={onNewStory}
            className="rounded-full bg-violet-600 px-6 py-3 text-white font-semibold hover:bg-violet-700 transition-colors cursor-pointer"
          >
            Create Another Story
          </button>
        </div>
      )}
    </div>
  );
}
