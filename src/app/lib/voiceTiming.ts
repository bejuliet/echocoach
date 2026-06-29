// Phase 0 instrumentation — measures voice pipeline latency without changing behavior.
// Enable on-screen timings: add ?debugVoice=1 to the URL (works on iPhone in production).

export type VoiceTimingStage =
  | "recording"
  | "audioProcessing"
  | "uploadAndTranscribe"
  | "uiUpdate"
  | "messageGeneration"
  | "totalPostStop";

export type VoiceTimingReport = {
  /** e.g. "transcribe" or "polish" */
  pipeline: "transcribe" | "polish";
  /** When the report was created (ISO string). */
  at: string;
  /** Duration of each stage in milliseconds. */
  stagesMs: Partial<Record<VoiceTimingStage, number>>;
  /** Extra context to correlate client logs with Convex dashboard logs. */
  meta: Record<string, string | number>;
};

/** True in dev, or when the URL contains ?debugVoice=1 */
export function isVoiceTimingEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (process.env.NODE_ENV === "development") return true;
  return new URLSearchParams(window.location.search).has("debugVoice");
}

export function formatMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function logVoiceTiming(report: VoiceTimingReport): void {
  console.log(
    `[EchoCoach:voiceTiming] ${report.pipeline}`,
    report.stagesMs,
    report.meta,
  );
}

/** Simple stopwatch for marking timestamps with performance.now(). */
export function createStopwatch() {
  const marks = new Map<string, number>();

  return {
    mark(name: string) {
      marks.set(name, performance.now());
    },
    /** Milliseconds between two marks (end defaults to last mark). */
    between(start: string, end: string): number {
      const a = marks.get(start);
      const b = marks.get(end);
      if (a === undefined || b === undefined) return 0;
      return b - a;
    },
    since(name: string): number {
      const t = marks.get(name);
      if (t === undefined) return 0;
      return performance.now() - t;
    },
  };
}

export function buildTranscribeReport(
  sw: ReturnType<typeof createStopwatch>,
  meta: Record<string, string | number>,
): VoiceTimingReport {
  const audioProcessing =
    sw.between("stopPressed", "bufferReady") ||
    sw.between("stopPressed", "blobReady");
  const uploadAndTranscribe = sw.between("bufferReady", "transcribeDone");
  const uiUpdate = sw.between("transcribeDone", "uiDone");
  const totalPostStop = sw.between("stopPressed", "uiDone");

  return {
    pipeline: "transcribe",
    at: new Date().toISOString(),
    stagesMs: {
      recording: sw.between("recordingStarted", "stopPressed"),
      audioProcessing,
      uploadAndTranscribe,
      uiUpdate,
      totalPostStop,
    },
    meta,
  };
}

export function buildPolishReport(
  sw: ReturnType<typeof createStopwatch>,
  meta: Record<string, string | number>,
): VoiceTimingReport {
  return {
    pipeline: "polish",
    at: new Date().toISOString(),
    stagesMs: {
      messageGeneration: sw.between("polishStart", "polishDone"),
      totalPostStop: sw.between("polishStart", "uiDone"),
    },
    meta,
  };
}
