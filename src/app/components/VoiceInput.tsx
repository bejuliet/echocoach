"use client";

import { useRef, useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";

// One reusable "ask a question by voice" block.
// It shows a prompt, a record button, and an editable text box. The coach can
// record (which transcribes via Whisper into the box), type/edit freely, then
// approve to move on. Re-recording appends to whatever text is already there.
type VoiceInputProps = {
  label: string; // the question shown to the coach
  value: string; // current text (owned by the parent wizard)
  onChange: (value: string) => void; // update the parent's text
  onApprove: () => void; // advance to the next step
  placeholder?: string;
  approveLabel?: string;
};

// MediaRecorder needs a format the browser actually supports. Chrome prefers
// webm; Safari prefers mp4. We pick the first supported option.
function pickMimeType(): string {
  const candidates = ["audio/webm", "audio/mp4", "audio/ogg"];
  if (typeof MediaRecorder === "undefined") return "";
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

export function VoiceInput({
  label,
  value,
  onChange,
  onApprove,
  placeholder,
  approveLabel = "Approve",
}: VoiceInputProps) {
  const transcribe = useAction(api.ai.transcribe);

  // "idle" | "recording" | "transcribing" tells us which UI to show.
  const [status, setStatus] = useState<
    "idle" | "recording" | "transcribing"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  // We keep the recorder and its captured audio chunks in refs so they survive
  // re-renders without triggering new ones.
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRecording() {
    setError(null);
    try {
      // Ask the browser for microphone access (prompts the user once).
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      chunksRef.current = [];

      // Collect audio data as it arrives.
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      // When recording stops, bundle the audio and send it to Whisper.
      recorder.onstop = async () => {
        // Release the microphone so the browser's "recording" indicator clears.
        stream.getTracks().forEach((track) => track.stop());

        const type = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        setStatus("transcribing");
        try {
          const bytes = await blob.arrayBuffer();
          const text = await transcribe({ audio: bytes, mimeType: type });
          // Append to any existing text so multiple recordings add up.
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

  const isRecording = status === "recording";
  const isTranscribing = status === "transcribing";
  const canApprove = value.trim().length > 0 && status === "idle";

  return (
    <div className="flex flex-col gap-4">
      <label className="text-lg font-semibold">{label}</label>

      {/* Record / stop button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isTranscribing}
          className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium shadow-sm transition-colors disabled:opacity-50 ${
            isRecording
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-accent text-white hover:opacity-90"
          }`}
        >
          <MicIcon className="h-4 w-4" />
          {isRecording ? "Stop recording" : "Record"}
        </button>

        {/* Friendly status text next to the button */}
        {isRecording && (
          <span className="flex items-center gap-2 text-sm text-red-600">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" />
            Listening...
          </span>
        )}
        {isTranscribing && (
          <span className="text-sm text-muted">Transcribing...</span>
        )}
      </div>

      {/* Editable transcript. The coach can fix anything before approving. */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Record above, or type here..."}
        rows={4}
        className="w-full resize-y rounded-2xl border border-border bg-surface px-4 py-3 text-base leading-relaxed shadow-sm outline-none transition-shadow focus:ring-2 focus:ring-accent/40"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div>
        <button
          type="button"
          onClick={onApprove}
          disabled={!canApprove}
          className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {approveLabel}
        </button>
      </div>
    </div>
  );
}

// Simple inline microphone icon (no extra dependency).
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
      <path d="M5 10a7 7 0 0 0 14 0" />
      <path d="M12 17v4" />
    </svg>
  );
}
