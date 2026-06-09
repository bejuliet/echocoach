"use client";

import { Button, PageHeader, StepBar } from "@/app/components/ui";
import { CelebrationHero } from "@/app/components/CelebrationHero";

// Shown after the coach approves the 4th intake answer — "Captured!" with ribbons.
type CapturedViewProps = {
  stepIndex: number;
  totalSteps: number;
  questionLabel: string;
  onBack: () => void;
  onContinue: () => void;
  isGenerating: boolean;
  error: string | null;
};

export function CapturedView({
  stepIndex,
  totalSteps,
  questionLabel,
  onBack,
  onContinue,
  isGenerating,
  error,
}: CapturedViewProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-card px-5 pb-6">
      <PageHeader onBack={onBack} />

      <div className="mt-1">
        <StepBar current={stepIndex + 1} total={totalSteps} />
      </div>

      <div className="mt-6 flex flex-col items-center gap-3 text-center">
        <RacketIcon />
        <h2 className="text-lg font-semibold leading-snug text-tennis-900">
          {questionLabel}
        </h2>
      </div>

      <div className="mt-10 flex flex-1 flex-col justify-center">
        <CelebrationHero
          title="Captured!"
          subtitle="Great! Let's move to the next one."
          variant="captured"
        />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <Button
          fullWidth
          icon={<ArrowRightIcon />}
          onClick={onContinue}
          loading={isGenerating}
          disabled={isGenerating}
        >
          Continue
        </Button>
        {isGenerating && (
          <p className="text-center text-sm text-ink-muted">
            Writing your review message...
          </p>
        )}
        {error && <p className="text-center text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}

function RacketIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-8 w-8 text-tennis-700"
      aria-hidden="true"
    >
      <ellipse cx="24" cy="16" rx="12" ry="14" />
      <path d="M24 30v14" />
      <path d="M18 38h12" />
      <path d="M18 16h12M24 8v16M16 16h16" />
    </svg>
  );
}

function ArrowRightIcon() {
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
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
