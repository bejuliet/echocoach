"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Button, LanguageSelector, type Language } from "@/app/components/ui";
import { Logo } from "@/app/components/Logo";
import { TennisBallIcon } from "@/app/components/TennisBallIcon";

const LANGUAGE_STORAGE_KEY = "echocoach.language";
const LANGUAGE_CHANGE_EVENT = "echocoach-language-change";

// Background anchor tuned for a 390 × 844 mobile viewport (DevTools iPhone 14 Pro).
const HOME_BG_POSITION = "32% 82%";

export default function HomePage() {
  const router = useRouter();
  const language = useSyncExternalStore(
    subscribeToLanguagePreference,
    getLanguagePreference,
    getServerLanguagePreference,
  );

  function handleLanguageChange(nextLanguage: Language) {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT));
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
            Capture class notes in one calm flow.
          </p>
        </div>

        <div className="-translate-y-[0.5cm] pb-8">
          <Button
            fullWidth
            icon={<MicIcon />}
            onClick={() => router.push("/review")}
            className="min-h-[4.5rem] !bg-gradient-to-b !from-tennis-800 !to-tennis-900 text-base shadow-lg hover:!from-tennis-900 hover:!to-[#0f3d24]"
          >
            New Class Review
          </Button>

          <nav className="mt-[3.75rem] flex overflow-hidden rounded-2xl bg-[#e8f1e7]/95 shadow-sm backdrop-blur-sm">
            <button
              type="button"
              onClick={() => router.push("/log")}
              className="flex min-h-[3.9rem] flex-1 items-center justify-center gap-2 border-r border-ink-muted/20 px-4 text-sm font-medium text-ink transition-colors hover:bg-white/40"
            >
              <HistoryIcon />
              History
            </button>
            <div className="flex min-h-[3.9rem] flex-1 items-center justify-center">
              <LanguageSelector
                variant="inline"
                value={language}
                onChange={handleLanguageChange}
              />
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}

function getLanguagePreference(): Language {
  const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return saved === "zh" ? "zh" : "en";
}

function getServerLanguagePreference(): Language {
  return "en";
}

function subscribeToLanguagePreference(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(LANGUAGE_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(LANGUAGE_CHANGE_EVENT, onStoreChange);
  };
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
