"use client";

// EchoCoach design-system language selector.
// A small EN / 中文 picker with a globe icon. UI only - it just reports the
// chosen value through onChange; it does NOT translate the app yet.
// Built on a native <select> so it works well and accessibly on mobile.
import type { ChangeEvent } from "react";

export type Language = "en" | "zh";

// The languages we offer, with the label shown to the user.
const LANGUAGES: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "zh", label: "中文" },
];

export function LanguageSelector({
  value,
  onChange,
  variant = "pill",
}: {
  value: Language;
  onChange: (next: Language) => void;
  /** "pill" for standalone use; "inline" for the home bottom bar. */
  variant?: "pill" | "inline";
}) {
  function handleChange(e: ChangeEvent<HTMLSelectElement>) {
    onChange(e.target.value as Language);
  }

  const styles =
    variant === "inline"
      ? "inline-flex min-h-[3.9rem] items-center justify-center gap-2 px-2 text-sm text-ink"
      : "inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-2 text-sm text-ink shadow-sm";

  return (
    <label className={styles}>
      <Globe />
      {/* The visible text is the native select; we hide its default arrow
          and add our own spacing for a cleaner, app-like look. */}
      <select
        value={value}
        onChange={handleChange}
        aria-label="Select language"
        className="cursor-pointer appearance-none bg-transparent pr-4 font-medium outline-none"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.value} value={lang.value}>
            {lang.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Globe() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-tennis-700"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
    </svg>
  );
}
