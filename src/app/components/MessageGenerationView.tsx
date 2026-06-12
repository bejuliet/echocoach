"use client";

import { useRef, useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardSubtitle,
  CardTitle,
  PageHeader,
} from "@/app/components/ui";
import { TennisBallIcon } from "@/app/components/TennisBallIcon";
import { CelebrationHero } from "@/app/components/CelebrationHero";
import { formatCardDate, getCopy } from "@/app/lib/i18n";
import { useLanguagePreference } from "@/app/lib/languagePreference";

// Message Generation screen — matches Design Concept "Review Ready" panel.
type MessageGenerationViewProps = {
  studentName: string;
  message: string;
  onMessageChange: (value: string) => void;
  onBack: () => void;
  onSave: () => void;
  onRegenerate: () => void;
  isSaving: boolean;
  isPolishing: boolean;
  error: string | null;
};

export function MessageGenerationView({
  studentName,
  message,
  onMessageChange,
  onBack,
  onSave,
  onRegenerate,
  isSaving,
  isPolishing,
  error,
}: MessageGenerationViewProps) {
  const language = useLanguagePreference();
  const copy = getCopy(language).review.ready;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [todayTimestamp] = useState(() => Date.now());

  const displayName = studentName.trim() || copy.yourStudent;
  const initials = getInitials(displayName);
  const todayLabel = formatCardDate(language, todayTimestamp);

  function focusMessage() {
    textareaRef.current?.focus();
  }

  return (
    <div className="flex min-h-dvh flex-col bg-canvas px-5 pb-6">
      <PageHeader
        title={copy.pageTitle}
        onBack={onBack}
        action={
          <Button variant="ghost" size="md" onClick={focusMessage}>
            {copy.edit}
          </Button>
        }
      />

      {/* Success hero — ribbons + localized headline from the design concept. */}
      <div className="mt-2">
        <CelebrationHero
          title={copy.heroTitle}
          subtitle={copy.heroSubtitle}
          variant="ready"
        />
      </div>

      {/* Message card — student header + editable body + coach signature. */}
      <div className="mt-5 flex-1 overflow-y-auto">
        <Card className="relative">
          <CardHeader
            leading={
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-tennis-100 text-sm font-semibold text-tennis-800">
                {initials}
              </span>
            }
            trailing={
              <TennisBallIcon className="h-7 w-7 shrink-0" />
            }
          >
            <CardTitle>{displayName}</CardTitle>
            <CardSubtitle>
              <span className="inline-flex items-center gap-1.5">
                <CalendarIcon />
                {todayLabel}
              </span>
            </CardSubtitle>
          </CardHeader>

          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            disabled={isPolishing}
            rows={12}
            className="mt-4 w-full resize-y rounded-2xl border border-line bg-canvas px-4 py-4 text-base leading-relaxed text-ink outline-none focus:ring-2 focus:ring-tennis-700/30 disabled:opacity-60"
          />

          <p className="mt-4 text-sm text-ink-muted">
            {copy.coachSignature}{" "}
            <span className="font-semibold text-ink">Tom Tao</span>
            <span className="ml-2 inline-block align-middle">
              <TennisBallIcon className="h-5 w-5" />
            </span>
          </p>

          {isPolishing && (
            <p className="mt-3 text-sm text-ink-muted">{copy.rewriting}</p>
          )}
        </Card>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      {/* Bottom actions — full-width primary + secondary (design concept). */}
      <div className="mt-4 flex flex-col gap-3">
        <Button
          fullWidth
          icon={<CheckIcon className="h-5 w-5" />}
          onClick={onSave}
          loading={isSaving}
          disabled={message.trim().length === 0 || isPolishing}
          className="!bg-gradient-to-b !from-tennis-800 !to-tennis-900 shadow-lg"
        >
          {copy.approveShare}
        </Button>
        <Button
          fullWidth
          variant="secondary"
          icon={<PencilIcon />}
          onClick={focusMessage}
          disabled={isPolishing}
        >
          {copy.editMessage}
        </Button>
        <button
          type="button"
          onClick={onRegenerate}
          disabled={isPolishing}
          className="text-sm font-medium text-tennis-700 underline-offset-4 hover:underline disabled:opacity-50"
        >
          {isPolishing ? copy.regenerating : copy.regenerate}
        </button>
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
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

function PencilIcon() {
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
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
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
