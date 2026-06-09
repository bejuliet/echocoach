// EchoCoach design-system navigation pieces.
//   1. BottomBar  - a floating pill bar fixed to the bottom thumb zone, for
//                   one-handed use on a phone (primary actions live here).
//   2. PageHeader - a top bar with an optional back arrow, a centered title,
//                   and an optional trailing action (e.g. "Edit").
import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// 1) BottomBar: rounded pill anchored near the bottom of the screen.
// ---------------------------------------------------------------------------
export function BottomBar({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none sticky bottom-4 flex justify-center">
      <nav className="pointer-events-auto flex items-center gap-2 rounded-full border border-line bg-card px-3 py-2 shadow-lg">
        {children}
      </nav>
    </div>
  );
}

// A single round icon button for use inside the BottomBar.
export function BottomBarAction({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string; // for screen readers
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-full text-tennis-800 transition-colors hover:bg-tennis-50"
    >
      {icon}
    </button>
  );
}

// ---------------------------------------------------------------------------
// 2) PageHeader: top bar for intake / message screens.
// ---------------------------------------------------------------------------
export function PageHeader({
  title,
  onBack,
  action,
}: {
  /** Omit or pass blank when the screen has no centered title (intake steps). */
  title?: string;
  /** When provided, a back arrow appears on the left. */
  onBack?: () => void;
  /** Optional element on the right (e.g. an Edit button). */
  action?: ReactNode;
}) {
  const showTitle = Boolean(title?.trim());

  return (
    <header className="flex items-center gap-2 py-2">
      <div className="flex w-11 justify-start">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-tennis-50"
          >
            <BackArrow />
          </button>
        )}
      </div>
      {showTitle ? (
        <h1 className="flex-1 truncate text-center text-lg font-semibold text-ink">
          {title}
        </h1>
      ) : (
        <div className="flex-1" />
      )}
      <div className="flex w-11 justify-end">{action}</div>
    </header>
  );
}

function BackArrow() {
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
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
