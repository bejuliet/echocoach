"use client";

import { useState } from "react";
import Link from "next/link";
import { useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { VoiceInput } from "./components/VoiceInput";

// The four questions the coach answers, in order. `key` matches the fields we
// store; `label` is the prompt shown on screen.
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

// The wizard moves through three phases:
//  - "collect": answering the 4 questions by voice
//  - "review":  approving the AI-polished message
//  - "done":    saved! offer to start another
type Phase = "collect" | "review" | "done";

export default function FeaturePage() {
  const polish = useAction(api.ai.polish);
  const createReview = useMutation(api.reviews.create);

  const [phase, setPhase] = useState<Phase>("collect");
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);

  const [message, setMessage] = useState("");
  const [isPolishing, setIsPolishing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStep = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  // Update one answer as the coach edits/records it.
  function setAnswer(key: AnswerKey, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  // Ask GPT to turn the four answers into a warm review message.
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

  // Approve a step. On the last step, generate the review instead of advancing.
  function approveStep() {
    if (isLastStep) {
      void generateMessage();
    } else {
      setStepIndex((i) => i + 1);
    }
  }

  // Save the approved message to the log.
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

  // Clear everything for a brand new review.
  function startOver() {
    setAnswers(EMPTY_ANSWERS);
    setMessage("");
    setStepIndex(0);
    setError(null);
    setPhase("collect");
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">
          New class review
        </h1>
        <p className="text-muted">
          Speak your notes after class. EchoCoach turns them into a warm,
          professional message for your student.
        </p>
      </header>

      {/* PHASE 1: collect the four answers, one at a time. */}
      {phase === "collect" && (
        <section className="flex flex-col gap-6 rounded-3xl border border-border bg-surface p-8 shadow-sm">
          <StepProgress current={stepIndex} total={STEPS.length} />
          <VoiceInput
            key={currentStep.key}
            label={currentStep.label}
            value={answers[currentStep.key]}
            onChange={(v) => setAnswer(currentStep.key, v)}
            onApprove={approveStep}
            approveLabel={isLastStep ? "Generate review" : "Approve & continue"}
            placeholder={
              currentStep.key === "studentName"
                ? "e.g. Emma"
                : "Record above, or type here..."
            }
          />

          {/* Let the coach step back to fix an earlier answer. */}
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={() => setStepIndex((i) => i - 1)}
              className="self-start text-sm text-muted underline-offset-4 hover:underline"
            >
              Back to previous question
            </button>
          )}

          {isPolishing && (
            <p className="text-sm text-muted">
              Writing your review message...
            </p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </section>
      )}

      {/* PHASE 2: review and approve the polished message. */}
      {phase === "review" && (
        <section className="flex flex-col gap-5 rounded-3xl border border-border bg-surface p-8 shadow-sm">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">
              Review message for {answers.studentName || "your student"}
            </h2>
            <p className="text-sm text-muted">
              Edit anything you like, then approve to save it to your log.
            </p>
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={14}
            className="w-full resize-y rounded-2xl border border-border bg-background px-5 py-4 text-base leading-relaxed shadow-inner outline-none focus:ring-2 focus:ring-accent/40"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={saveReview}
              disabled={isSaving || message.trim().length === 0}
              className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {isSaving ? "Saving..." : "Approve & save"}
            </button>
            <button
              type="button"
              onClick={generateMessage}
              disabled={isPolishing}
              className="rounded-full border border-border px-6 py-2.5 text-sm font-medium transition-colors hover:bg-accent-soft disabled:opacity-40"
            >
              {isPolishing ? "Rewriting..." : "Regenerate"}
            </button>
            <button
              type="button"
              onClick={() => setPhase("collect")}
              className="rounded-full px-6 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-accent-soft hover:text-accent"
            >
              Edit answers
            </button>
          </div>
        </section>
      )}

      {/* PHASE 3: saved confirmation. */}
      {phase === "done" && (
        <section className="flex flex-col items-start gap-5 rounded-3xl border border-border bg-surface p-8 shadow-sm">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">Saved to your log</h2>
            <p className="text-muted">
              Your review for {answers.studentName || "your student"} is ready
              to share.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={startOver}
              className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
            >
              Start a new review
            </button>
            <Link
              href="/log"
              className="rounded-full border border-border px-6 py-2.5 text-sm font-medium transition-colors hover:bg-accent-soft"
            >
              View log
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

// A small "1 of 4" indicator with dots, so the coach knows where they are.
function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted">
      <span>
        Question {current + 1} of {total}
      </span>
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-6 rounded-full transition-colors ${
              i <= current ? "bg-accent" : "bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
