"use client";

import { Button } from "@/app/components/ui";
import { getCopy } from "@/app/lib/i18n";
import { useLanguagePreference } from "@/app/lib/languagePreference";

// Shown after the coach approves and saves — keeps the same flow, tennis-green styling.
export function ReviewSavedView({
  studentName,
  shareNotice,
  onStartOver,
  onViewLog,
}: {
  studentName: string;
  shareNotice?: string | null;
  onStartOver: () => void;
  onViewLog: () => void;
}) {
  const language = useLanguagePreference();
  const copy = getCopy(language).review.saved;
  const displayName = studentName.trim() || copy.yourStudent;

  return (
    <div className="flex min-h-dvh flex-col bg-canvas px-5 pb-8 pt-6">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-tennis-700 text-white shadow-md">
          <CheckIcon className="h-8 w-8" />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-tennis-900">{copy.title}</h2>
          <p className="text-sm text-ink-muted">{copy.body(displayName)}</p>
          {shareNotice && (
            <p className="text-sm text-ink-muted">{shareNotice}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button fullWidth onClick={onStartOver}>
          {copy.startOver}
        </Button>
        <Button fullWidth variant="secondary" onClick={onViewLog}>
          {copy.viewLog}
        </Button>
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}
