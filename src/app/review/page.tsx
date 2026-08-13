"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { VoiceInput } from "../components/VoiceInput";
import { CapturedView } from "../components/CapturedView";
import { MessageGenerationView } from "../components/MessageGenerationView";
import { ReviewSavedView } from "../components/ReviewSavedView";
import {
  PageHeader,
  Button,
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
import { shareClassReviewMessage } from "@/app/lib/shareMessage";
import { useLanguagePreference, getLanguagePreference } from "@/app/lib/languagePreference";
import { VoiceTimingPanel } from "../components/VoiceTimingPanel";
import {
  buildPolishReport,
  createStopwatch,
  isVoiceTimingEnabled,
  logVoiceTiming,
  type VoiceTimingReport,
} from "@/app/lib/voiceTiming";

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
  const activeStudents = useQuery(api.students.listActive);

  const [phase, setPhase] = useState<Phase>("collect");
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);
  const [studentId, setStudentId] = useState("");
  const [captureStage, setCaptureStage] = useState<Stage>("listening");

  const [message, setMessage] = useState("");
  const [isPolishing, setIsPolishing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const [timingReports, setTimingReports] = useState<VoiceTimingReport[]>([]);
  const nextClassNumber = useQuery(
    api.reviews.nextClassNumber,
    studentId ? { studentId } : "skip",
  );

  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  function setAnswer(key: StepKey, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function appendTimingReport(report: VoiceTimingReport) {
    setTimingReports((prev) => [...prev, report]);
  }

  async function generateMessage() {
    setError(null);
    setIsPolishing(true);
    const sw = isVoiceTimingEnabled() ? createStopwatch() : null;
    sw?.mark("polishStart");
    try {
      // Read fresh preference in case it changed before this async call runs.
      const activeLanguage = getLanguagePreference();
      const today = formatToday(activeLanguage);
      const result = await polish({
        ...answers,
        today,
        language: activeLanguage,
      });
      sw?.mark("polishDone");
      setMessage(result);
      setPhase("review");
      sw?.mark("uiDone");

      if (sw && isVoiceTimingEnabled()) {
        const report = buildPolishReport(sw, {
          language: activeLanguage,
          answerChars:
            answers.studentName.length +
            answers.whatWeDid.length +
            answers.progress.length +
            answers.nextSteps.length,
        });
        logVoiceTiming(report);
        appendTimingReport(report);
      }
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
      await createReview({ ...answers, studentId, message });
      const outcome = await shareClassReviewMessage(message);
      setShareNotice(
        outcome === "copied" ? copy.saved.shareCopiedNotice : null,
      );
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.errors.saveFailed);
    } finally {
      setIsSaving(false);
    }
  }

  function startOver() {
    setAnswers(EMPTY_ANSWERS);
    setStudentId("");
    setMessage("");
    setStepIndex(0);
    setError(null);
    setShareNotice(null);
    setPhase("collect");
    setCaptureStage("listening");
  }

  if (phase === "collect") {
    return (
      <>
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

          {currentStep.key === "studentName" ? (
            <StudentSelector
              students={activeStudents}
              studentId={studentId}
              onChange={(nextStudentId) => {
                const student = activeStudents?.find(
                  (item) => item.studentId === nextStudentId,
                );
                setStudentId(nextStudentId);
                setAnswer("studentName", student?.name ?? "");
              }}
              onContinue={approveStep}
              copy={copy.studentSelect}
            />
          ) : (
            <>
              <VoiceInput
                key={currentStep.key}
                value={answers[currentStep.key]}
                onChange={(v) => setAnswer(currentStep.key, v)}
                onApprove={approveStep}
                onStageChange={setCaptureStage}
                stepKey={currentStep.key}
                onTimingReport={appendTimingReport}
              />

              <div className="mt-6 border-t border-line pt-4">
                <StageTracker active={captureStage} language={language} />
              </div>
            </>
          )}
        </div>
        <VoiceTimingPanel
          reports={timingReports}
          onClear={() => setTimingReports([])}
        />
      </>
    );
  }

  if (phase === "captured") {
    return (
      <>
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
        <VoiceTimingPanel
          reports={timingReports}
          onClear={() => setTimingReports([])}
        />
      </>
    );
  }

  if (phase === "review") {
    return (
      <MessageGenerationView
        studentName={answers.studentName}
        classNumber={nextClassNumber}
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
      shareNotice={shareNotice}
      onStartOver={startOver}
      onViewLog={() => router.push("/log")}
    />
  );
}

function StudentSelector({
  students,
  studentId,
  onChange,
  onContinue,
  copy,
}: {
  students: { studentId: string; name: string }[] | undefined;
  studentId: string;
  onChange: (studentId: string) => void;
  onContinue: () => void;
  copy: {
    placeholder: string;
    loading: string;
    empty: string;
    continue: string;
  };
}) {
  const isLoading = students === undefined;

  return (
    <div className="flex flex-1 flex-col justify-center gap-5 py-8">
      <div className="rounded-3xl border border-line bg-canvas p-5 shadow-sm">
        <label
          htmlFor="student-select"
          className="mb-2 block text-sm font-medium text-ink"
        >
          {copy.placeholder}
        </label>
        <select
          id="student-select"
          value={studentId}
          onChange={(event) => onChange(event.target.value)}
          disabled={isLoading || (students?.length ?? 0) === 0}
          className="min-h-14 w-full rounded-2xl border border-line bg-card px-4 text-base text-ink shadow-sm outline-none focus:border-tennis-700 focus:ring-2 focus:ring-tennis-700/20 disabled:opacity-60"
        >
          <option value="">
            {isLoading ? copy.loading : copy.placeholder}
          </option>
          {students?.map((student) => (
            <option key={student.studentId} value={student.studentId}>
              {student.name}
            </option>
          ))}
        </select>
        {!isLoading && (students?.length ?? 0) === 0 && (
          <p className="mt-3 text-sm text-ink-muted">{copy.empty}</p>
        )}
      </div>

      <Button fullWidth onClick={onContinue} disabled={!studentId}>
        {copy.continue}
      </Button>
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
