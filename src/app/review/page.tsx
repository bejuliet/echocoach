"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAction, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { VoiceInput } from "../components/VoiceInput";
import { CapturedView } from "../components/CapturedView";
import { MessageGenerationView } from "../components/MessageGenerationView";
import { ReviewSavedView } from "../components/ReviewSavedView";
import {
  PageHeader,
  StepBar,
  StageTracker,
  type Stage,
} from "@/app/components/ui";
import {
  formatToday,
  getStepQuestions,
  getCopy,
  type StepKey,
} from "@/app/lib/i18n";
import { useLanguagePreference, getLanguagePreference } from "@/app/lib/languagePreference";

type Answers = Record<StepKey, string>;

const EMPTY_ANSWERS: Answers = {
  studentName: "",
  whatWeDid: "",
  progress: "",
  nextSteps: "",
};

type Phase = "collect" | "captured" | "review" | "done";

export default function ReviewPage() {
  const router = useRouter();
  const language = useLanguagePreference();
  const copy = getCopy(language).review;
  const steps = useMemo(() => getStepQuestions(language), [language]);

  const polish = useAction(api.ai.polish);
  const createReview = useMutation(api.reviews.create);

  const [phase, setPhase] = useState<Phase>("collect");
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);
  const [captureStage, setCaptureStage] = useState<Stage>("listening");

  const [message, setMessage] = useState("");
  const [isPolishing, setIsPolishing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  function setAnswer(key: StepKey, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  async function generateMessage() {
    setError(null);
    setIsPolishing(true);
    try {
      // Read fresh preference in case it changed before this async call runs.
      const activeLanguage = getLanguagePreference();
      const today = formatToday(activeLanguage);
      const result = await polish({
        ...answers,
        today,
        language: activeLanguage,
      });
      setMessage(result);
      setPhase("review");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : copy.errors.generateFailed,
      );
    } finally {
      setIsPolishing(false);
    }
  }

  function approveStep() {
    if (isLastStep) {
      setPhase("captured");
    } else {
      setStepIndex((i) => i + 1);
      setCaptureStage("listening");
    }
  }

  function handleBack() {
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
      setCaptureStage("listening");
    } else {
      router.push("/");
    }
  }

  async function saveReview() {
    setError(null);
    setIsSaving(true);
    try {
      await createReview({ ...answers, message });
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.errors.saveFailed);
    } finally {
      setIsSaving(false);
    }
  }

  function startOver() {
    setAnswers(EMPTY_ANSWERS);
    setMessage("");
    setStepIndex(0);
    setError(null);
    setPhase("collect");
    setCaptureStage("listening");
  }

  if (phase === "collect") {
    return (
      <div className="flex min-h-dvh flex-col bg-card px-5 pb-6">
        <PageHeader onBack={handleBack} />

        <div className="mt-1">
          <StepBar
            current={stepIndex + 1}
            total={steps.length}
            language={language}
          />
        </div>

        <div className="mt-6 flex flex-col items-center gap-3 text-center">
          <RacketIcon />
          <h2 className="text-lg font-semibold leading-snug text-tennis-900">
            {currentStep.label}
          </h2>
        </div>

        <VoiceInput
          key={currentStep.key}
          value={answers[currentStep.key]}
          onChange={(v) => setAnswer(currentStep.key, v)}
          onApprove={approveStep}
          onStageChange={setCaptureStage}
          stepKey={currentStep.key}
        />

        <div className="mt-6 border-t border-line pt-4">
          <StageTracker active={captureStage} language={language} />
        </div>
      </div>
    );
  }

  if (phase === "captured") {
    return (
      <CapturedView
        stepIndex={stepIndex}
        totalSteps={steps.length}
        questionLabel={currentStep.label}
        onBack={() => {
          setPhase("collect");
          setCaptureStage("generated");
        }}
        onContinue={() => void generateMessage()}
        isGenerating={isPolishing}
        error={error}
      />
    );
  }

  if (phase === "review") {
    return (
      <MessageGenerationView
        studentName={answers.studentName}
        message={message}
        onMessageChange={setMessage}
        onBack={() => {
          setPhase("captured");
        }}
        onSave={saveReview}
        onRegenerate={generateMessage}
        isSaving={isSaving}
        isPolishing={isPolishing}
        error={error}
      />
    );
  }

  return (
    <ReviewSavedView
      studentName={answers.studentName}
      onStartOver={startOver}
      onViewLog={() => router.push("/log")}
    />
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
