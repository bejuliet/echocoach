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

export default function LogPage() {
  const router = useRouter();

  // useQuery is reactive: when a new review is saved, this list updates on its own.
  const reviews = useQuery(api.reviews.list);

  const isLoading = reviews === undefined;
  const total = reviews?.length ?? 0;

  // Count how many different students appear in the log.
  const studentCount = useMemo(() => {
    if (!reviews) return 0;
    return new Set(reviews.map((review) => review.studentName.trim().toLowerCase()))
      .size;
  }, [reviews]);

  return (
    <div className="flex min-h-dvh flex-col bg-canvas px-5 pb-8">
      <PageHeader title="History" onBack={() => router.push("/")} />

      <header className="mt-2 flex flex-col gap-1">
        <p className="text-sm text-ink-muted">
          Every approved class review, saved for your records.
        </p>
      </header>

      {/* Dashboard summary — matches the design-system stat cards. */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Card padding="sm">
          <p className="text-2xl font-bold text-tennis-700">
            {isLoading ? "—" : total}
          </p>
          <CardSubtitle>Reviews saved</CardSubtitle>
        </Card>
        <Card padding="sm">
          <p className="truncate text-2xl font-bold text-tennis-700">
            {isLoading ? "—" : studentCount}
          </p>
          <CardSubtitle>Students</CardSubtitle>
        </Card>
      </div>

      <div className="mt-6 flex flex-1 flex-col gap-4">
        {isLoading ? (
          <p className="text-sm text-ink-muted">Loading your reviews...</p>
        ) : total === 0 ? (
          <Card className="flex flex-col items-start gap-4 border-dashed">
            <p className="text-sm leading-relaxed text-ink-muted">
              No reviews yet. Your saved class reviews will appear here.
            </p>
            <Button
              icon={<MicIcon />}
              onClick={() => router.push("/review")}
            >
              New Class Review
            </Button>
          </Card>
        ) : (
          <ul className="flex flex-col gap-4">
            {reviews.map((review) => (
              <ReviewCard
                key={review._id}
                studentName={review.studentName}
                createdAt={review.createdAt}
                message={review.message}
              />
            ))}
          </ul>
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
            New Class Review
          </Button>
        </div>
      )}
    </div>
  );
}

// One saved review — same card pattern as the Review Ready message preview.
function ReviewCard({
  studentName,
  createdAt,
  message,
}: {
  studentName: string;
  createdAt: number;
  message: string;
}) {
  const [copied, setCopied] = useState(false);

  const displayName = studentName.trim() || "Your student";
  const initials = getInitials(displayName);
  const dateLabel = new Date(createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  async function copy() {
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
          trailing={<TennisBallIcon className="h-7 w-7 shrink-0" />}
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

        <div className="mt-4">
          <Button
            variant="secondary"
            size="md"
            icon={<CopyIcon />}
            onClick={copy}
          >
            {copied ? "Copied!" : "Copy message"}
          </Button>
        </div>
      </Card>
    </li>
  );
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
