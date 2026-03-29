"use client";

import { useState, useCallback, useEffect } from "react";

interface StoryDisplayProps {
  storyText: string;
  isStreaming: boolean;
  onNewStory: () => void;
}

export function StoryDisplay({ storyText, isStreaming, onNewStory }: StoryDisplayProps) {
  const [isReading, setIsReading] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);

  useEffect(() => {
    setCanSpeak("speechSynthesis" in window);
  }, []);

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

  return (
    <div className="mt-8 w-full animate-fade-in-up">
      {/* Story card */}
      <div className="relative rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200/60 p-6 sm:p-8 shadow-lg shadow-amber-100/50">
        {/* Decorative corner elements */}
        <div className="absolute top-3 left-4 text-amber-300 text-lg" aria-hidden="true">&#10022;</div>
        <div className="absolute top-3 right-4 text-amber-300 text-lg" aria-hidden="true">&#10022;</div>

        <p className="whitespace-pre-wrap text-lg leading-8 text-amber-950 font-medium">
          {storyText}
          {isStreaming && (
            <span className="inline-block w-0.5 h-5 bg-amber-700 align-middle ml-0.5 animate-blink" />
          )}
        </p>
      </div>

      {/* Action buttons */}
      {!isStreaming && storyText && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          {canSpeak && (
            <button
              onClick={handleReadAloud}
              className={`rounded-full px-6 py-3 font-bold transition-all cursor-pointer shadow-md ${
                isReading
                  ? "bg-red-100 text-red-700 border-2 border-red-200 hover:bg-red-200"
                  : "bg-amber-100 text-amber-800 border-2 border-amber-200 hover:bg-amber-200"
              }`}
            >
              {isReading ? "\u23F9 Stop Reading" : "\u{1F50A} Read Aloud"}
            </button>
          )}
          <button
            onClick={() => {
              window.speechSynthesis?.cancel();
              setIsReading(false);
              onNewStory();
            }}
            className="rounded-full bg-violet-600 px-6 py-3 text-white font-bold hover:bg-violet-700 transition-all cursor-pointer shadow-lg shadow-violet-300 hover:shadow-xl"
          >
            &#10024; Create Another Story
          </button>
        </div>
      )}
    </div>
  );
}
