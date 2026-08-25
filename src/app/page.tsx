"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, LanguageSelector } from "@/app/components/ui";
import { Logo } from "@/app/components/Logo";
import { TennisBallIcon } from "@/app/components/TennisBallIcon";
import { getCopy } from "@/app/lib/i18n";
import {
  useLanguagePreference,
  useSetLanguagePreference,
} from "@/app/lib/languagePreference";

// Background anchor tuned for a 390 × 844 mobile viewport (DevTools iPhone 14 Pro).
const HOME_BG_POSITION = "32% 82%";

export default function HomePage() {
  const router = useRouter();
  const language = useLanguagePreference();
  const setLanguage = useSetLanguagePreference();
  const copy = getCopy(language).home;

  function handleLanguageChange(nextLanguage: typeof language) {
    setLanguage(nextLanguage);
  }

  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-tennis-50">
      <Image
        src="/home-background.png"
        alt=""
        fill
        priority
        sizes="390px"
        className="object-cover"
        style={{ objectPosition: HOME_BG_POSITION }}
      />

      <div className="relative z-10 flex min-h-dvh w-full flex-col px-7">
        <header className="mt-[1cm] flex flex-col items-center pt-14 text-center">
          <div className="relative mb-4 inline-block">
            <Logo className="h-[4.5rem] w-[4.5rem] text-tennis-900" />
            <TennisBallIcon className="absolute right-0 top-[0.35rem] h-6 w-6" />
          </div>
          <h1 className="text-[2.35rem] font-bold leading-none tracking-tight text-tennis-900">
            EchoCoach
          </h1>
          <p className="mt-2 text-sm font-medium text-tennis-800">
            Coach. Capture. Connect.
          </p>
          <div
            aria-hidden="true"
            className="mt-4 h-px w-14 bg-ink-muted/35"
          />
        </header>

        <div className="flex flex-1 items-center justify-center px-3 pb-6 text-center">
          <p className="max-w-[17rem] text-sm leading-6 text-black">
            {copy.tagline}
          </p>
        </div>

        <div className="-translate-y-[0.5cm] pb-8">
          <Button
            fullWidth
            icon={<MicIcon />}
            onClick={() => router.push("/review")}
            className="min-h-[4.5rem] !bg-gradient-to-b !from-tennis-800 !to-tennis-900 text-base shadow-lg hover:!from-tennis-900 hover:!to-[#0f3d24]"
          >
            {copy.newClassReview}
          </Button>

          <nav className="mt-[3.75rem] flex overflow-hidden rounded-2xl bg-[#e8f1e7]/95 shadow-sm backdrop-blur-sm">
            <button
              type="button"
              onClick={() => router.push("/log")}
              className="flex min-h-[3.9rem] flex-1 items-center justify-center gap-2 border-r border-ink-muted/20 px-4 text-sm font-medium text-ink transition-colors hover:bg-white/40"
            >
              <HistoryIcon />
              {copy.history}
            </button>
            <div className="flex min-h-[3.9rem] flex-1 items-center justify-center">
              <LanguageSelector
                variant="inline"
                value={language}
                onChange={handleLanguageChange}
              />
            </div>
            <button
              type="button"
              onClick={() => router.push("/students/new")}
              className="flex min-h-[3.9rem] flex-1 items-center justify-center gap-2 px-4 text-sm font-medium text-ink transition-colors hover:bg-white/40"
            >
              <StudentAddIcon />
              New Student
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
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

function HistoryIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[1.15rem] w-[1.15rem] text-tennis-800"
      aria-hidden="true"
    >
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  );
}

function StudentAddIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-[1.15rem] w-[1.15rem] text-tennis-800" aria-hidden="true">
      <circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0M19 8v6M16 11h6" />
    </svg>
  );
}
