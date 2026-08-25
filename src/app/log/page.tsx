"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Button,
  Card,
  CardHeader,
  CardSubtitle,
  CardTitle,
  PageHeader,
} from "@/app/components/ui";
import { TennisBallIcon } from "@/app/components/TennisBallIcon";
import { formatCardDate, getCopy } from "@/app/lib/i18n";
import { useLanguagePreference } from "@/app/lib/languagePreference";
import type { Language } from "@/app/components/ui";

export default function LogPage() {
  const router = useRouter();
  const language = useLanguagePreference();
  const copy = getCopy(language).log;
  const [selectedStudent, setSelectedStudent] = useState("");

  // useQuery is reactive: when a new review is saved, this list updates on its own.
  const reviews = useQuery(api.reviews.list);

  const isLoading = reviews === undefined;
  const total = reviews?.length ?? 0;

  // Student names are stored as one free-form string per review. Keep group
  // labels (for example, "Emma and Noah") intact rather than guessing how to
  // split them into separate people.
  const studentOptions = useMemo(() => {
    const names = new Map<string, string>();
    for (const review of reviews ?? []) {
      const displayName = review.studentName.trim() || copy.yourStudent;
      const key = normalizeStudentName(displayName);
      if (!names.has(key)) names.set(key, displayName);
    }
    return Array.from(names, ([value, label]) => ({ value, label })).sort(
      (a, b) =>
        a.label.localeCompare(
          b.label,
          language === "zh" ? "zh-CN" : "en-US",
        ),
    );
  }, [copy.yourStudent, language, reviews]);

  const activeStudent = studentOptions.some(
    (student) => student.value === selectedStudent,
  )
    ? selectedStudent
    : "";

  const filteredReviews = useMemo(() => {
    if (!reviews || !activeStudent) return reviews ?? [];
    return reviews.filter(
      (review) =>
        normalizeStudentName(review.studentName.trim() || copy.yourStudent) ===
        activeStudent,
    );
  }, [activeStudent, copy.yourStudent, reviews]);

  const studentCount = studentOptions.length;

  return (
    <div className="flex min-h-dvh flex-col bg-canvas px-5 pb-8">
      <PageHeader title={copy.title} onBack={() => router.push("/")} />

      <header className="mt-2 flex flex-col gap-1">
        <p className="text-sm text-ink-muted">{copy.subtitle}</p>
      </header>

      {/* Dashboard summary — matches the design-system stat cards. */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Card padding="sm">
          <p className="text-2xl font-bold text-tennis-700">
            {isLoading ? "—" : total}
          </p>
          <CardSubtitle>{copy.reviewsSaved}</CardSubtitle>
        </Card>
        <Card padding="sm">
          <p className="truncate text-2xl font-bold text-tennis-700">
            {isLoading ? "—" : studentCount}
          </p>
          <CardSubtitle>{copy.students}</CardSubtitle>
        </Card>
      </div>

      <div className="mt-6 flex flex-1 flex-col gap-4">
        {isLoading ? (
          <p className="text-sm text-ink-muted">{copy.loading}</p>
        ) : total === 0 ? (
          <Card className="flex flex-col items-start gap-4 border-dashed">
            <p className="text-sm leading-relaxed text-ink-muted">{copy.empty}</p>
            <Button
              icon={<MicIcon />}
              onClick={() => router.push("/review")}
            >
              {copy.newClassReview}
            </Button>
          </Card>
        ) : (
          <>
            <div>
              <label
                htmlFor="student-filter"
                className="mb-2 block text-sm font-medium text-ink"
              >
                {copy.filterByStudent}
              </label>
              <select
                id="student-filter"
                value={activeStudent}
                onChange={(event) => setSelectedStudent(event.target.value)}
                className="min-h-11 w-full rounded-2xl border border-line bg-card px-4 text-sm text-ink shadow-sm outline-none focus:border-tennis-700 focus:ring-2 focus:ring-tennis-700/20"
              >
                <option value="">{copy.allStudents}</option>
                {studentOptions.map((student) => (
                  <option key={student.value} value={student.value}>
                    {student.label}
                  </option>
                ))}
              </select>
            </div>

            {filteredReviews.length === 0 ? (
              <Card className="border-dashed">
                <p className="text-sm text-ink-muted">
                  {copy.noFilteredReviews}
                </p>
              </Card>
            ) : (
              <ul className="flex flex-col gap-4">
                {filteredReviews.map((review) => (
                  <ReviewCard
                    key={review._id}
                    language={language}
                    studentName={review.studentName}
                    classNumber={review.classNumber}
                    createdAt={review.createdAt}
                    message={review.message}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {/* Thumb-zone CTA when the coach already has saved reviews. */}
      {!isLoading && total > 0 && (
        <div className="mt-6">
          <Button
            fullWidth
            icon={<MicIcon />}
            onClick={() => router.push("/review")}
            className="!bg-gradient-to-b !from-tennis-800 !to-tennis-900 shadow-lg"
          >
            {copy.newClassReview}
          </Button>
        </div>
      )}
    </div>
  );
}

// One saved review — same card pattern as the Review Ready message preview.
function ReviewCard({
  language,
  studentName,
  classNumber,
  createdAt,
  message,
}: {
  language: Language;
  studentName: string;
  classNumber?: number;
  createdAt: number;
  message: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = getCopy(language).log;

  const displayName = studentName.trim() || copy.yourStudent;
  const initials = getInitials(displayName);
  const dateLabel = formatCardDate(language, createdAt);

  async function copyMessage() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }


  return (
    <li>
      <Card>
        <CardHeader
          leading={
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-tennis-100 text-sm font-semibold text-tennis-800">
              {initials}
            </span>
          }
          trailing={
            <div className="flex shrink-0 flex-col items-end gap-1">
              <TennisBallIcon className="h-7 w-7" />
              {classNumber !== undefined && (
                <span className="text-xs font-medium text-tennis-800">
                  {copy.classTaken(classNumber)}
                </span>
              )}
            </div>
          }
        >
          <CardTitle>{displayName}</CardTitle>
          <CardSubtitle>
            <span className="inline-flex items-center gap-1.5">
              <CalendarIcon />
              {dateLabel}
            </span>
          </CardSubtitle>
        </CardHeader>

        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink">
          {message}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            icon={<CopyIcon />}
            onClick={copyMessage}
          >
            {copied ? copy.copied : copy.copyMessage}
          </Button>
        </div>
      </Card>
    </li>
  );
}

function normalizeStudentName(name: string): string {
  return name.trim().toLocaleLowerCase();
}

function getInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function MicIcon() {
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
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v4" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function CopyIcon() {
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
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
