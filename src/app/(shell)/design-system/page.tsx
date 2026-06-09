"use client";

// EchoCoach LIVE STYLEGUIDE.
// A single scrollable page that renders every design-system deliverable so you
// can see and click the foundation. This route is standalone and does not
// change any existing page. Everything here uses the additive tennis-green
// tokens from globals.css and the components in src/app/components/ui.
import { useState } from "react";
import Link from "next/link";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardSubtitle,
  StepBar,
  StageTracker,
  type Stage,
  BottomBar,
  BottomBarAction,
  PageHeader,
  LanguageSelector,
  type Language,
} from "@/app/components/ui";

export default function DesignSystemPage() {
  // Local state so the interactive demos (stage tracker, language, step) work.
  const [stage, setStage] = useState<Stage>("transcribing");
  const [language, setLanguage] = useState<Language>("en");
  const [step, setStep] = useState(2);

  return (
    <main className="mx-auto flex max-w-md flex-col gap-10 px-5 py-10">
      {/* Page intro */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-tennis-700">
          EchoCoach
        </span>
        <h1 className="text-3xl font-bold text-ink">
          Design System
        </h1>
        <p className="text-ink-muted">
          A mobile-first, tennis-green foundation. Everything below is live -
          tap and try it.
        </p>
        <Link
          href="/"
          className="mt-1 text-sm font-medium text-tennis-700 hover:underline"
        >
          &larr; Back to app
        </Link>
      </div>

      {/* 1. COLOR PALETTE */}
      <Section number={1} title="Color palette">
        <div className="grid grid-cols-2 gap-3">
          <Swatch name="tennis-700" hex="#1f7a4d" className="bg-tennis-700" note="Primary" />
          <Swatch name="tennis-600" hex="#2e7d52" className="bg-tennis-600" note="Hover" />
          <Swatch name="tennis-800" hex="#166534" className="bg-tennis-800" note="Pressed" />
          <Swatch name="tennis-500" hex="#3aae5f" className="bg-tennis-500" note="Success" />
          <Swatch name="tennis-100" hex="#dcefe1" className="bg-tennis-100" note="Soft fill" dark />
          <Swatch name="tennis-50" hex="#f0f7f1" className="bg-tennis-50" note="Tint" dark />
          <Swatch name="lime-500" hex="#a8d84b" className="bg-lime-500" note="Accent" dark />
          <Swatch name="lime-400" hex="#c2e66e" className="bg-lime-400" note="Accent" dark />
          <Swatch name="ink" hex="#1c2b22" className="bg-ink" note="Text" />
          <Swatch name="ink-muted" hex="#5c6b62" className="bg-ink-muted" note="Muted text" />
          <Swatch name="canvas" hex="#f4f8f3" className="bg-canvas" note="Page bg" dark />
          <Swatch name="line" hex="#e2e8e3" className="bg-line" note="Borders" dark />
        </div>
        {/* The home "court" gradient. */}
        <div className="mt-3 overflow-hidden rounded-2xl border border-line">
          <div className="flex h-16 items-center justify-center bg-gradient-to-r from-court-from to-court-to text-sm font-medium text-ink">
            Court hero gradient
          </div>
        </div>
      </Section>

      {/* 2. TYPOGRAPHY */}
      <Section number={2} title="Typography">
        <Card>
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-3xl font-bold text-ink">Display</p>
              <p className="text-xs text-ink-muted">Sans · 30px · bold</p>
            </div>
            <div>
              <p className="text-xl font-semibold text-ink">
                Heading
              </p>
              <p className="text-xs text-ink-muted">Sans · 20px · semibold</p>
            </div>
            <div>
              <p className="text-base text-ink">
                Body text - clear and readable outdoors at arm&apos;s length.
              </p>
              <p className="text-xs text-ink-muted">Sans · 16px · regular</p>
            </div>
            <div>
              <p className="text-sm text-ink-muted">
                Caption / secondary information.
              </p>
              <p className="text-xs text-ink-muted">Sans · 14px · muted</p>
            </div>
          </div>
        </Card>
      </Section>

      {/* 3. BUTTON HIERARCHY */}
      <Section number={3} title="Button hierarchy">
        <div className="flex flex-col gap-3">
          <Button variant="primary" icon={<Mic />}>
            Primary - record voice
          </Button>
          <Button variant="secondary">Secondary - regenerate</Button>
          <div className="flex gap-3">
            <Button variant="ghost" size="md">
              Ghost
            </Button>
            <Button variant="danger" size="md">
              Cancel
            </Button>
          </div>
          <div className="flex gap-3">
            <Button size="md">Medium</Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
          </div>
        </div>
      </Section>

      {/* 4. CARD STYLES */}
      <Section number={4} title="Card styles">
        <div className="flex flex-col gap-4">
          {/* Question card */}
          <Card>
            <CardSubtitle>Question card</CardSubtitle>
            <p className="mt-1 text-lg text-ink">
              What did we work on today?
            </p>
          </Card>

          {/* Message card with avatar + date header */}
          <Card>
            <CardHeader
              leading={
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-tennis-100 font-semibold text-tennis-800">
                  TT
                </span>
              }
            >
              <CardTitle>Coach Tom</CardTitle>
              <CardSubtitle>June 9, 2026</CardSubtitle>
            </CardHeader>
            <p className="mt-3 text-sm leading-relaxed text-ink">
              Great session today! Emma&apos;s forehand is getting more
              consistent and her footwork has improved noticeably.
            </p>
          </Card>

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card padding="sm">
              <p className="text-2xl font-bold text-tennis-700">24</p>
              <CardSubtitle>Reviews</CardSubtitle>
            </Card>
            <Card padding="sm">
              <p className="text-2xl font-bold text-tennis-700">8</p>
              <CardSubtitle>Students</CardSubtitle>
            </Card>
          </div>
        </div>
      </Section>

      {/* 5. SPACING SYSTEM */}
      <Section number={5} title="Spacing scale">
        <Card>
          <p className="mb-3 text-sm text-ink-muted">
            Based on a 4px unit. Screen padding 20px, stack gaps 12-16px, touch
            targets &ge; 44px.
          </p>
          <div className="flex flex-col gap-2">
            {[
              { label: "xs · 4px", w: "w-1" },
              { label: "sm · 8px", w: "w-2" },
              { label: "md · 16px", w: "w-4" },
              { label: "lg · 24px", w: "w-6" },
              { label: "xl · 32px", w: "w-8" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className={`${s.w} h-4 rounded bg-tennis-500`} />
                <span className="text-xs text-ink-muted">{s.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 rounded-xl bg-tennis-50 p-3 text-xs text-tennis-800">
            Thumb zone: keep the primary action near the bottom of the screen
            for one-handed use.
          </p>
        </Card>
      </Section>

      {/* 6. PROGRESS INDICATOR */}
      <Section number={6} title="Progress indicator">
        <Card>
          <StepBar current={step} total={4} />
          <div className="mt-3 flex gap-2">
            <Button
              size="md"
              variant="secondary"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
            >
              Prev
            </Button>
            <Button
              size="md"
              variant="secondary"
              onClick={() => setStep((s) => Math.min(4, s + 1))}
            >
              Next
            </Button>
          </div>
          <div className="mt-5">
            <StageTracker active={stage} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["listening", "transcribing", "generated", "confirmed"] as Stage[]).map(
              (s) => (
                <button
                  key={s}
                  onClick={() => setStage(s)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    stage === s
                      ? "bg-tennis-700 text-white"
                      : "bg-tennis-50 text-tennis-800"
                  }`}
                >
                  {s}
                </button>
              ),
            )}
          </div>
        </Card>
      </Section>

      {/* 7. NAVIGATION */}
      <Section number={7} title="Navigation">
        <div className="flex flex-col gap-4">
          <Card padding="sm">
            <PageHeader
              title="Class Review"
              onBack={() => {}}
              action={
                <Button variant="ghost" size="md">
                  Edit
                </Button>
              }
            />
          </Card>
          <BottomBar>
            <BottomBarAction icon={<Mic />} label="Record" />
            <Button size="md">New review</Button>
            <BottomBarAction icon={<List />} label="History" />
          </BottomBar>
        </div>
      </Section>

      {/* 8. LANGUAGE SELECTOR */}
      <Section number={8} title="Language selector">
        <Card>
          <div className="flex items-center justify-between">
            <CardSubtitle>Current: {language === "en" ? "English" : "中文"}</CardSubtitle>
            <LanguageSelector value={language} onChange={setLanguage} />
          </div>
        </Card>
      </Section>

      <p className="pb-6 text-center text-xs text-ink-muted">
        EchoCoach Design System · foundation only
      </p>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Small helpers used only by this styleguide page.
// ---------------------------------------------------------------------------

// A titled section wrapper with a numbered badge.
function Section({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-tennis-700 text-sm font-semibold text-white">
          {number}
        </span>
        <h2 className="text-xl font-semibold text-ink">{title}</h2>
      </div>
      {children}
    </section>
  );
}

// A single color swatch tile.
function Swatch({
  name,
  hex,
  className,
  note,
  dark = false,
}: {
  name: string;
  hex: string;
  className: string;
  note: string;
  dark?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      <div
        className={`flex h-16 items-end p-2 ${className} ${
          dark ? "text-ink" : "text-white"
        }`}
      >
        <span className="text-xs font-medium">{note}</span>
      </div>
      <div className="bg-card px-2 py-1.5">
        <p className="text-xs font-medium text-ink">{name}</p>
        <p className="text-[11px] text-ink-muted">{hex}</p>
      </div>
    </div>
  );
}

function Mic() {
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

function List() {
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
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}
