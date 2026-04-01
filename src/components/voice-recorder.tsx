"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "@/contexts/locale-context";
import { t } from "@/lib/i18n";

interface VoiceRecorderProps {
  onVoiceCloned: (voiceId: string) => void;
  existingVoiceId: string | null;
  onClearVoice: () => void;
}

export function VoiceRecorder({
  onVoiceCloned,
  existingVoiceId,
  onClearVoice,
}: VoiceRecorderProps) {
  const { locale } = useLocale();
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const secondsRef = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const MIN_SECONDS = 10;
  const MAX_SECONDS = 120;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function uploadRecording() {
    if (chunksRef.current.length === 0) return;

    const blob = new Blob(chunksRef.current, { type: "audio/webm" });

    if (secondsRef.current < MIN_SECONDS) {
      setError(t(locale, "voiceTooShort"));
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");

      const response = await fetch("/api/clone-voice", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to clone voice.");
      }

      localStorage.setItem("clonedVoiceId", data.voiceId);
      onVoiceCloned(data.voiceId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to process recording."
      );
    } finally {
      setIsUploading(false);
    }
  }

  function stopRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);

    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    recorder.onstop = () => {
      recorder.stream.getTracks().forEach((track) => track.stop());
      uploadRecording();
    };
    recorder.stop();
  }

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setSeconds(0);
      secondsRef.current = 0;

      timerRef.current = setInterval(() => {
        secondsRef.current += 1;
        setSeconds(secondsRef.current);
        if (secondsRef.current >= MAX_SECONDS) {
          stopRecording();
        }
      }, 1000);
    } catch {
      setError(t(locale, "voiceMicError"));
    }
  }

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Already have a cloned voice
  if (existingVoiceId) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-surface-border)] px-4 py-3">
        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
        <p className="text-sm font-medium text-[var(--color-foreground)] flex-1">
          {t(locale, "voiceReady")}
        </p>
        <button
          onClick={onClearVoice}
          className="text-xs text-[var(--color-muted)] hover:text-[var(--color-error-text-light)] transition-colors cursor-pointer font-medium"
        >
          {t(locale, "voiceRerecord")}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-surface-border)] p-4">
      <p className="text-sm font-bold text-[var(--color-foreground)] mb-3">
        🎙️ {t(locale, "voiceTitle")}
      </p>
      <p className="text-xs text-[var(--color-muted)] mb-4">
        {t(locale, "voiceDescription")}
      </p>

      {isRecording ? (
        <div className="flex flex-col items-center gap-3">
          {/* Recording indicator */}
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-lg font-bold text-[var(--color-foreground)] tabular-nums">
              {formatTime(seconds)}
            </span>
          </div>

          {/* Volume bars animation */}
          <div className="flex items-end gap-1 h-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-1.5 bg-red-400 rounded-full"
                style={{
                  animation: `voiceBar 0.${3 + i}s ease-in-out infinite alternate`,
                  height: `${12 + (i % 3) * 8}px`,
                }}
              />
            ))}
          </div>

          <p className="text-xs text-[var(--color-muted)]">
            {seconds < MIN_SECONDS
              ? t(locale, "voiceKeepGoing")
              : t(locale, "voiceGoodToStop")}
          </p>

          <button
            onClick={stopRecording}
            disabled={seconds < MIN_SECONDS}
            className="rounded-full px-6 py-2.5 font-bold text-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-red-600 text-white hover:bg-red-500"
          >
            ⏹ {t(locale, "voiceStop")}
          </button>
        </div>
      ) : isUploading ? (
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="w-8 h-8 rounded-full border-3 border-[var(--color-primary-light)] border-t-[var(--color-primary)] animate-spin" />
          <p className="text-sm font-medium text-[var(--color-primary)]">
            {t(locale, "voiceProcessing")}
          </p>
        </div>
      ) : (
        <button
          onClick={startRecording}
          className="w-full rounded-xl py-3 font-bold text-sm transition-all cursor-pointer bg-[var(--color-read-bg)] text-[var(--color-read-text)] border-2 border-[var(--color-read-border)] hover:bg-[var(--color-read-hover)]"
        >
          🎙️ {t(locale, "voiceStart")}
        </button>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-500 font-medium text-center">
          {error}
        </p>
      )}
    </div>
  );
}
