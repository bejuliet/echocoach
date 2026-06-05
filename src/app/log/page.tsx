"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function LogPage() {
  // useQuery is reactive: when a new review is saved, this list updates on its
  // own. It returns `undefined` while the data is still loading.
  const reviews = useQuery(api.reviews.list);

  const isLoading = reviews === undefined;
  const total = reviews?.length ?? 0;
  const latestStudent = reviews?.[0]?.studentName;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Review log</h1>
        <p className="text-muted">
          Every approved class review, saved for your records.
        </p>
      </header>

      {/* Small dashboard summary. */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Reviews saved" value={isLoading ? "-" : `${total}`} />
        <StatCard
          label="Most recent student"
          value={isLoading ? "-" : (latestStudent ?? "None yet")}
        />
      </div>

      {/* Loading / empty / list states. */}
      {isLoading ? (
        <p className="text-muted">Loading your reviews...</p>
      ) : total === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-3xl border border-dashed border-border bg-surface p-8 text-muted shadow-sm">
          <p>No reviews yet. Your saved class reviews will appear here.</p>
          <Link
            href="/"
            className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
          >
            Create your first review
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-5">
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
  );
}

// One number on the dashboard.
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 truncate text-2xl font-semibold">{value}</p>
    </div>
  );
}

// One saved review, with a copy-to-clipboard button for easy sharing.
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

  async function copy() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    // Reset the "Copied!" label after a moment.
    setTimeout(() => setCopied(false), 1500);
  }

  const dateLabel = new Date(createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <li className="flex flex-col gap-3 rounded-3xl border border-border bg-surface p-7 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-lg font-semibold">{studentName}</span>
          <span className="text-sm text-muted">{dateLabel}</span>
        </div>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-full border border-border px-4 py-1.5 text-sm transition-colors hover:bg-accent-soft hover:text-accent"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      {/* `whitespace-pre-wrap` preserves the line breaks in the message. */}
      <p className="whitespace-pre-wrap leading-relaxed text-foreground">
        {message}
      </p>
    </li>
  );
}
