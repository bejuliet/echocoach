"use client";

import {
  formatMs,
  isVoiceTimingEnabled,
  type VoiceTimingReport,
} from "@/app/lib/voiceTiming";

const STAGE_LABELS: Record<string, string> = {
  recording: "Recording (user)",
  audioProcessing: "Audio processing",
  uploadAndTranscribe: "Upload + transcribe",
  uiUpdate: "UI update",
  messageGeneration: "Message generation (GPT)",
  totalPostStop: "Total post-stop",
};

type VoiceTimingPanelProps = {
  reports: VoiceTimingReport[];
  onClear?: () => void;
};

/** Dev-only overlay — visible when ?debugVoice=1 or in local development. */
export function VoiceTimingPanel({ reports, onClear }: VoiceTimingPanelProps) {
  if (!isVoiceTimingEnabled() || reports.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 max-h-48 overflow-y-auto border-t border-line bg-card/95 px-3 py-2 text-left shadow-lg backdrop-blur-sm">
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-tennis-900">
          Voice timing (Phase 0)
        </p>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-ink-muted underline"
          >
            Clear
          </button>
        )}
      </div>
      <ul className="space-y-2">
        {[...reports].reverse().map((report, index) => (
          <li
            key={`${report.at}-${index}`}
            className="rounded-lg bg-canvas px-2 py-1.5 text-xs text-ink"
          >
            <p className="font-medium text-tennis-800">
              {report.pipeline}{" "}
              <span className="font-normal text-ink-muted">
                {report.meta.stepKey ? `· ${report.meta.stepKey}` : ""}
              </span>
            </p>
            <dl className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5">
              {Object.entries(report.stagesMs).map(([key, ms]) =>
                ms !== undefined && ms > 0 ? (
                  <div key={key} className="flex justify-between gap-2">
                    <dt className="text-ink-muted">
                      {STAGE_LABELS[key] ?? key}
                    </dt>
                    <dd className="font-mono">{formatMs(ms)}</dd>
                  </div>
                ) : null,
              )}
            </dl>
            {"byteLength" in report.meta && (
              <p className="mt-1 text-ink-muted">
                {report.meta.mimeType as string} ·{" "}
                {Math.round(Number(report.meta.byteLength) / 1024)} KB
              </p>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-1 text-[10px] text-ink-muted">
        Server timings: Convex dashboard → Logs → search transcribe_timing
      </p>
    </div>
  );
}
