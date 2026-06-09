"use client";

import { useState } from "react";
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

const STEPS = [
  { key: "studentName", label: "What is the student's name?" },
  { key: "whatWeDid", label: "What did we do in the class?" },
  { key: "progress", label: "What was the progress?" },
  { key: "nextSteps", label: "What are the next steps and practice?" },
] as const;

type AnswerKey = (typeof STEPS)[number]["key"];
type Answers = Record<AnswerKey, string>;

const EMPTY_ANSWERS: Answers = {
  studentName: "",
  whatWeDid: "",
  progress: "",
  nextSteps: "",
};

type Phase = "collect" | "captured" | "review" | "done";

export default function ReviewPage() {
  const router = useRouter();
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

  const currentStep = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  function setAnswer(key: AnswerKey, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  async function generateMessage() {
    setError(null);
    setIsPolishing(true);
    try {
      const today = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const result = await polish({ ...answers, today });
      setMessage(result);
      setPhase("review");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not generate the message.",
      );
    } finally {
      setIsPolishing(false);
    }
  }

  function approveStep() {
    if (isLastStep) {
      // Show the "Captured!" celebration before generating the review message.
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
      setError(
        err instanceof Error ? err.message : "Could not save the review.",
      );
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

  /* PHASE 1 — Review Intake (design concept). No shell header; full mobile screen. */
  if (phase === "collect") {
    return (
      <div className="flex min-h-dvh flex-col bg-card px-5 pb-6">
        <PageHeader onBack={handleBack} />

        <div className="mt-1">
          <StepBar current={stepIndex + 1} total={STEPS.length} />
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
          approveLabel="Looks Good"
          placeholder={
            currentStep.key === "studentName"
              ? "e.g. Emma"
              : "Or type your answer here..."
          }
        />

        <div className="mt-6 border-t border-line pt-4">
          <StageTracker active={captureStage} />
        </div>
      </div>
    );
  }

  /* After question 4 — "Captured!" screen, then Continue generates the message. */
  if (phase === "captured") {
    return (
      <CapturedView
        stepIndex={stepIndex}
        totalSteps={STEPS.length}
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
