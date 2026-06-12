"use client";

import { useEffect, useRef, useState } from "react";
import { useAction } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/app/components/ui/Button";
import type { Stage } from "@/app/components/ui/ProgressIndicator";
import { getCopy } from "@/app/lib/i18n";
import { getLanguagePreference, useLanguagePreference } from "@/app/lib/languagePreference";
import {
  startRecording,
  type RecordingSession,
} from "@/app/lib/recordAudio";

// One question's voice capture flow — matches Design Concept states:
// Listening → Transcribing → Generated (Looks Good / Edit). No Cancel, no Confirmed screen.
type VoiceInputProps = {
  value: string;
  onChange: (value: string) => void;
  onApprove: () => void;
  onStageChange?: (stage: Stage) => void;
  stepKey?: "studentName" | "whatWeDid" | "progress" | "nextSteps";
};

function formatTranscribeError(err: unknown, fallback: string): string {
  if (err instanceof ConvexError) {
    const data = err.data as { message?: string };
    if (data.message) return data.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export function VoiceInput({
  value,
  onChange,
  onApprove,
  onStageChange,
  stepKey,
}: VoiceInputProps) {
  const language = useLanguagePreference();
  const copy = getCopy(language).review.voice;
  const transcribe = useAction(api.ai.transcribe);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [status, setStatus] = useState<
    "idle" | "recording" | "transcribing"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<RecordingSession | null>(null);

  const isRecording = status === "recording";
  const isTranscribing = status === "transcribing";
  const hasText = value.trim().length > 0;
  const showGenerated = hasText && status === "idle";
  const placeholder =
    stepKey === "studentName"
      ? copy.placeholderStudentName
      : copy.placeholderDefault;

  // Tell the parent which stage to highlight in the bottom StageTracker.
  useEffect(() => {
    if (!onStageChange) return;
    if (isRecording) onStageChange("listening");
    else if (isTranscribing) onStageChange("transcribing");
    else if (hasText) onStageChange("generated");
    else onStageChange("listening");
  }, [isRecording, isTranscribing, hasText, onStageChange]);

  async function startMic() {
    setError(null);
    try {
      sessionRef.current = await startRecording();
      setStatus("recording");
    } catch {
      setError(copy.micBlocked);
      setStatus("idle");
    }
  }

  async function stopMic() {
    const session = sessionRef.current;
    sessionRef.current = null;
    if (!session) return;

    setStatus("transcribing");
    try {
      const { blob, mimeType } = await session.stop();

      if (blob.size === 0) {
        setError(copy.transcribeFailed);
        setStatus("idle");
        return;
      }

      const audio = await blob.arrayBuffer();
      const text = await transcribe({
        audio,
        mimeType,
        language: getLanguagePreference(),
      });
      const next = value ? `${value.trim()} ${text}`.trim() : text;
      onChange(next);
    } catch (err) {
      setError(formatTranscribeError(err, copy.transcribeFailed));
    } finally {
      setStatus("idle");
    }
  }

  function handleMicPress() {
    if (isTranscribing) return;
    if (isRecording) void stopMic();
    else void startMic();
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Listening or transcribing — large center circle from the mockup. */}
      {!showGenerated && (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <button
            type="button"
            onClick={handleMicPress}
            disabled={isTranscribing}
            aria-label={isRecording ? copy.micStop : copy.micStart}
            className="relative flex h-44 w-44 items-center justify-center disabled:opacity-60"
          >
            {isRecording && (
              <>
                <span className="absolute inset-2 animate-ping rounded-full bg-tennis-500/25" />
                <span className="absolute inset-5 animate-pulse rounded-full bg-tennis-200/80" />
              </>
            )}
            <span className="relative flex h-28 w-28 items-center justify-center rounded-full bg-tennis-700 text-white shadow-lg">
              {isTranscribing ? (
                <span className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <MicIcon className="h-10 w-10" />
              )}
            </span>
          </button>

          <p className="max-w-[16rem] text-sm leading-6 text-ink-muted">
            {isTranscribing
              ? copy.transcribing
              : isRecording
                ? copy.listening
                : copy.idle}
          </p>

          {/* Allow typing before first recording. */}
          {!isRecording && !isTranscribing && (
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              rows={3}
              className="w-full resize-none rounded-2xl border border-line bg-canvas px-4 py-3 text-sm leading-relaxed text-ink outline-none focus:ring-2 focus:ring-tennis-700/30"
            />
          )}
        </div>
      )}

      {/* Generated — transcript with Looks Good + Edit. */}
      {showGenerated && (
        <div className="flex flex-1 flex-col gap-4">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={6}
            className="w-full resize-y rounded-2xl border border-line bg-canvas px-4 py-4 text-base leading-relaxed text-ink outline-none focus:ring-2 focus:ring-tennis-700/30"
          />
          <div className="flex flex-col gap-3">
            <Button fullWidth onClick={onApprove}>
              {copy.looksGood}
            </Button>
            <Button
              fullWidth
              variant="secondary"
              icon={<PencilIcon />}
              onClick={() => textareaRef.current?.focus()}
            >
              {copy.edit}
            </Button>
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v4" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
