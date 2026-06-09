// EchoCoach design-system Card.
// A soft, rounded white surface used to group content. Mobile-first with
// generous padding and a gentle shadow. Compose the small sub-parts
// (CardHeader / CardTitle / CardSubtitle) for richer cards like the message card.
import type { ReactNode } from "react";

type CardProps = {
  /** "sm" for tighter cards (e.g. stats), "lg" for roomy content cards. */
  padding?: "sm" | "lg";
  children: ReactNode;
  className?: string;
};

const paddings = {
  sm: "p-5",
  lg: "p-7",
};

export function Card({ padding = "lg", children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-3xl border border-line bg-card shadow-sm ${paddings[padding]} ${className}`}
    >
      {children}
    </div>
  );
}

// Header row: optional leading element (e.g. avatar) + a title/subtitle stack.
export function CardHeader({
  leading,
  trailing,
  children,
  className = "",
}: {
  leading?: ReactNode;
  trailing?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {leading}
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      {trailing}
    </div>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <span className="text-lg font-semibold text-ink">{children}</span>;
}

export function CardSubtitle({ children }: { children: ReactNode }) {
  return <span className="text-sm text-ink-muted">{children}</span>;
}
