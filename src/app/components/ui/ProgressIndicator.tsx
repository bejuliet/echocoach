// EchoCoach design-system progress indicators.
// Two related pieces from the mockup:
//   1. StepBar     - "Step X of N" with a segmented filled bar (which question).
//   2. StageTracker - the 4 voice stages for a single question
//                     (Listening -> Transcribing -> Generated -> Confirmed).
import type { ReactNode } from "react";
import type { Language } from "./LanguageSelector";
import { getCopy } from "@/app/lib/i18n";

// ---------------------------------------------------------------------------
// 1) StepBar: shows which question the coach is on, out of the total.
// ---------------------------------------------------------------------------
export function StepBar({
  current,
  total,
  language = "en",
}: {
  current: number; // 1-based: the question currently being answered
  total: number;
  language?: Language;
}) {
  const copy = getCopy(language);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-ink-muted">
        {copy.progress.stepOf(current, total)}
      </span>
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            // Filled (green) up to the current step, light grey beyond it.
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < current ? "bg-tennis-700" : "bg-line"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2) StageTracker: the 4 capture stages for one question.
// ---------------------------------------------------------------------------
export type Stage = "listening" | "transcribing" | "generated" | "confirmed";

const STAGE_IDS: Stage[] = [
  "listening",
  "transcribing",
  "generated",
  "confirmed",
];

export function StageTracker({
  active,
  language = "en",
}: {
  active: Stage;
  language?: Language;
}) {
  const copy = getCopy(language);
  const stages = STAGE_IDS.map((id) => ({
    id,
    label: copy.progress.stages[id].label,
    caption: copy.progress.stages[id].caption,
  }));
  const activeIndex = stages.findIndex((s) => s.id === active);

  return (
    <ol className="flex items-start justify-between gap-1">
      {stages.map((stage, i) => {
        const isDone = i < activeIndex;
        const isActive = i === activeIndex;
        return (
          <li
            key={stage.id}
            className="flex flex-1 flex-col items-center gap-1 text-center"
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-tennis-700 text-white"
                  : isDone
                    ? "bg-tennis-100 text-tennis-800"
                    : "bg-line text-ink-muted"
              }`}
            >
              {isDone ? <CheckMark /> : i + 1}
            </span>
            <span
              className={`text-xs font-medium ${
                isActive ? "text-ink" : "text-ink-muted"
              }`}
            >
              {stage.label}
            </span>
            <span className="text-[11px] leading-tight text-ink-muted">
              {stage.caption}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function CheckMark(): ReactNode {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}
