"use client";

import { useEffect, useRef, useState } from "react";
import { useAction } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/app/components/ui/Button";
import type { Stage } from "@/app/components/ui/ProgressIndicator";
import { getCopy } from "@/app/lib/i18n";
import { getLanguagePreference, useLanguagePreference } from "@/app/lib/languagePreference";

// One question's voice capture flow — matches Design Concept states:
// Listening → Transcribing → Generated (Looks Good / Edit). No Cancel, no Confirmed screen.
type VoiceInputProps = {
  value: string;
  onChange: (value: string) => void;
  onApprove: () => void;
  onStageChange?: (stage: Stage) => void;
  stepKey?: "studentName" | "whatWeDid" | "progress" | "nextSteps";
};

function isAppleDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function pickMimeType(): string {
  // iOS Safari records audio/mp4; desktop Chrome prefers webm.
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = isAppleDevice()
    ? ["audio/mp4", "audio/webm", "audio/ogg"]
    : ["audio/webm", "audio/mp4", "audio/ogg"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function normalizeRecordingMime(type: string, apple: boolean): string {
  const mime = type.toLowerCase();
  if (mime.includes("mp4") || mime.includes("m4a")) return "audio/mp4";
  if (mime.includes("webm")) return "audio/webm";
  if (mime.includes("ogg")) return "audio/ogg";
  if (mime.includes("wav")) return "audio/wav";
  return apple ? "audio/mp4" : "audio/webm";
}

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

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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

  async function startRecording() {
    setError(null);
    const apple = isAppleDevice();
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
        // Build the blob before stopping tracks — stopping the mic early breaks Safari.
        const type = normalizeRecordingMime(
          recorder.mimeType || mimeType,
          apple,
        );
        const blob = new Blob(chunksRef.current, { type });
        stream.getTracks().forEach((track) => track.stop());

        // #region agent log
        fetch("http://127.0.0.1:7817/ingest/47e5338f-9597-435e-b23e-18b27512f27d",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"4d2960"},body:JSON.stringify({sessionId:"4d2960",runId:"ios-fix",hypothesisId:"H1",location:"VoiceInput.tsx:onstop",message:"recording assembled",data:{mimeType:type,byteLength:blob.size,chunkCount:chunksRef.current.length,apple},timestamp:Date.now()})}).catch(()=>{});
        // #endregion

        if (blob.size === 0) {
          setError(copy.transcribeFailed);
          setStatus("idle");
          return;
        }

        setStatus("transcribing");
        try {
          const bytes = new Uint8Array(await blob.arrayBuffer());
          const text = await transcribe({
            audio: bytes.buffer,
            mimeType: type,
            language: getLanguagePreference(),
          });
          const next = value ? `${value.trim()} ${text}`.trim() : text;
          onChange(next);
        } catch (err) {
          // #region agent log
          fetch("http://127.0.0.1:7817/ingest/47e5338f-9597-435e-b23e-18b27512f27d",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"4d2960"},body:JSON.stringify({sessionId:"4d2960",runId:"ios-fix",hypothesisId:"H2",location:"VoiceInput.tsx:transcribeError",message:"transcribe failed",data:{error:formatTranscribeError(err,copy.transcribeFailed),byteLength:blob.size,mimeType:type},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
          setError(formatTranscribeError(err, copy.transcribeFailed));
        } finally {
          setStatus("idle");
        }
      };

      // Safari/iOS needs 1000ms slices for Whisper-compatible mp4 (250ms was too small).
      recorder.start(apple ? 1000 : 250);
      recorderRef.current = recorder;
      setStatus("recording");
    } catch {
      setError(copy.micBlocked);
      setStatus("idle");
    }
  }

  function stopRecording() {
    const recorder = recorderRef.current;
    if (recorder && recorder.state === "recording") {
      // requestData() before stop can corrupt iOS mp4 recordings.
      if (!isAppleDevice()) recorder.requestData();
      recorder.stop();
    }
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
