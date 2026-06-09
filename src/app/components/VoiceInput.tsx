"use client";

import { useEffect, useRef, useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/app/components/ui/Button";
import type { Stage } from "@/app/components/ui/ProgressIndicator";

// One question's voice capture flow — matches Design Concept states:
// Listening → Transcribing → Generated (Looks Good / Edit). No Cancel, no Confirmed screen.
type VoiceInputProps = {
  value: string;
  onChange: (value: string) => void;
  onApprove: () => void;
  onStageChange?: (stage: Stage) => void;
  placeholder?: string;
  approveLabel?: string;
};

function pickMimeType(): string {
  const candidates = ["audio/webm", "audio/mp4", "audio/ogg"];
  if (typeof MediaRecorder === "undefined") return "";
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

export function VoiceInput({
  value,
  onChange,
  onApprove,
  onStageChange,
  placeholder,
  approveLabel = "Looks Good",
}: VoiceInputProps) {
  const transcribe = useAction(api.ai.transcribe);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [status, setStatus] = useState<
    "idle" | "recording" | "transcribing"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const isRecording = status === "recording";
  const isTranscribing = status === "transcribing";
  const hasText = value.trim().length > 0;
  const showGenerated = hasText && status === "idle";

  // Tell the parent which stage to highlight in the bottom StageTracker.
  useEffect(() => {
    if (!onStageChange) return;
    if (isRecording) onStageChange("listening");
    else if (isTranscribing) onStageChange("transcribing");
    else if (hasText) onStageChange("generated");
    else onStageChange("listening");
  }, [isRecording, isTranscribing, hasText, onStageChange]);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        const type = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        setStatus("transcribing");
        try {
          const bytes = await blob.arrayBuffer();
          const text = await transcribe({ audio: bytes, mimeType: type });
          const next = value ? `${value.trim()} ${text}`.trim() : text;
          onChange(next);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Could not transcribe audio.",
          );
        } finally {
          setStatus("idle");
        }
      };

      recorder.start();
      recorderRef.current = recorder;
      setStatus("recording");
    } catch {
      setError(
        "Microphone access was blocked. Please allow it in your browser to record.",
      );
      setStatus("idle");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    recorderRef.current = null;
  }

  function handleMicPress() {
    if (isTranscribing) return;
    if (isRecording) stopRecording();
    else void startRecording();
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
            aria-label={isRecording ? "Stop recording" : "Start recording"}
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
              ? "Transcribing... Turning your voice into text."
              : isRecording
                ? "Listening... Speak naturally. We're capturing your notes."
                : "Tap the microphone to speak, or type below."}
          </p>

          {/* Allow typing before first recording. */}
          {!isRecording && !isTranscribing && (
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder ?? "Or type your answer here..."}
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
              {approveLabel}
            </Button>
            <Button
              fullWidth
              variant="secondary"
              icon={<PencilIcon />}
              onClick={() => textareaRef.current?.focus()}
            >
              Edit
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
