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
import {
  buildTranscribeReport,
  createStopwatch,
  isVoiceTimingEnabled,
  logVoiceTiming,
  type VoiceTimingReport,
} from "@/app/lib/voiceTiming";

// One question's voice capture flow — matches Design Concept states:
// Listening → Transcribing → Generated (Looks Good / Edit). No Cancel, no Confirmed screen.
type VoiceInputProps = {
  value: string;
  onChange: (value: string) => void;
  onApprove: () => void;
  onStageChange?: (stage: Stage) => void;
  stepKey?: "studentName" | "whatWeDid" | "progress" | "nextSteps";
  /** Phase 0: optional callback when a transcribe timing report is ready. */
  onTimingReport?: (report: VoiceTimingReport) => void;
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
  onTimingReport,
}: VoiceInputProps) {
  const language = useLanguagePreference();
  const copy = getCopy(language).review.voice;
  const transcribe = useAction(api.ai.transcribe);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [status, setStatus] = useState<
    "idle" | "recording" | "processing" | "transcribing"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  // True once the user focuses the textarea — keeps layout stable while typing.
  const [typingMode, setTypingMode] = useState(false);

  const sessionRef = useRef<RecordingSession | null>(null);
  const timingRef = useRef<ReturnType<typeof createStopwatch> | null>(null);

  const isRecording = status === "recording";
  const isProcessing = status === "processing";
  const isTranscribing = status === "transcribing";
  const isBusy = isProcessing || isTranscribing;
  const hasText = value.trim().length > 0;
  const showTextarea = !isRecording && !isBusy;
  const showActions = hasText && status === "idle";
  const placeholder =
    stepKey === "studentName"
      ? copy.placeholderStudentName
      : copy.placeholderDefault;

  function handleTextChange(next: string) {
    if (!next.trim()) {
      // Back to voice-first UI if the user clears the field entirely.
      setTypingMode(false);
    } else {
      // Any typed input keeps the stable layout (voice uses onChange directly).
      setTypingMode(true);
    }
    onChange(next);
  }

  // Tell the parent which stage to highlight in the bottom StageTracker.
  useEffect(() => {
    if (!onStageChange) return;
    if (isRecording) onStageChange("listening");
    else if (isBusy) onStageChange("transcribing");
    else if (hasText) onStageChange("generated");
    else onStageChange("listening");
  }, [isRecording, isBusy, hasText, onStageChange]);

  async function startMic() {
    setError(null);
    try {
      if (isVoiceTimingEnabled()) {
        timingRef.current = createStopwatch();
        timingRef.current.mark("recordingStarted");
      }
      sessionRef.current = await startRecording();
      setStatus("recording");
    } catch {
      setError(copy.micBlocked);
      setStatus("idle");
      timingRef.current = null;
    }
  }

  async function stopMic() {
    const session = sessionRef.current;
    sessionRef.current = null;
    if (!session) return;

    const sw = timingRef.current;
    sw?.mark("stopPressed");

    setStatus("processing");
    try {
      const { blob, mimeType } = await session.stop();
      sw?.mark("blobReady");

      if (blob.size === 0) {
        setError(copy.transcribeFailed);
        setStatus("idle");
        timingRef.current = null;
        return;
      }

      const audio = await blob.arrayBuffer();
      sw?.mark("bufferReady");

      setStatus("transcribing");

      const text = await transcribe({
        audio,
        mimeType,
        language: getLanguagePreference(),
      });
      sw?.mark("transcribeDone");

      const next = value ? `${value.trim()} ${text}`.trim() : text;
      onChange(next);
      sw?.mark("uiDone");

      if (sw && isVoiceTimingEnabled()) {
        const report = buildTranscribeReport(sw, {
          stepKey: stepKey ?? "unknown",
          mimeType,
          byteLength: blob.size,
          platform: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 60) : "",
        });
        logVoiceTiming(report);
        onTimingReport?.(report);
      }
    } catch (err) {
      setError(formatTranscribeError(err, copy.transcribeFailed));
    } finally {
      setStatus("idle");
      timingRef.current = null;
    }
  }

  function handleMicPress() {
    if (isBusy) return;
    if (isRecording) void stopMic();
    else void startMic();
  }

  const statusMessage = isProcessing
    ? copy.processingAudio
    : isTranscribing
      ? copy.transcribing
      : isRecording
        ? copy.listening
        : copy.idle;

  return (
    <div className="flex flex-1 flex-col gap-5 pt-4">
      {/* Mic stays visible while idle (even when typing) so nothing jumps. */}
      <div className="flex flex-col items-center gap-5 text-center">
        <button
          type="button"
          onClick={handleMicPress}
          disabled={isBusy}
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
            {isBusy ? (
              <span className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <MicIcon className="h-10 w-10" />
            )}
          </span>
        </button>

        <p className="max-w-[16rem] text-sm leading-6 text-ink-muted">
          {statusMessage}
        </p>
      </div>

      {/* Single textarea — same element and styling throughout; hidden only while recording. */}
      {showTextarea && (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => handleTextChange(e.target.value)}
          onFocus={() => setTypingMode(true)}
          placeholder={placeholder}
          rows={4}
          className="w-full resize-y rounded-2xl border border-line bg-canvas px-4 py-4 text-base leading-relaxed text-ink outline-none focus:ring-2 focus:ring-tennis-700/30"
        />
      )}

      {showActions && (
        <div className="flex flex-col gap-3">
          <Button fullWidth onClick={onApprove}>
            {copy.looksGood}
          </Button>
          {!typingMode && (
            <Button
              fullWidth
              variant="secondary"
              icon={<PencilIcon />}
              onClick={() => textareaRef.current?.focus()}
            >
              {copy.edit}
            </Button>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
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
