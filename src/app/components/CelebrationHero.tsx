// Shared success hero — checkmark + ribbon confetti burst from the design concept.
type CelebrationHeroProps = {
  title: string;
  subtitle: string;
  /** "captured" = mint circle + dark check (intake). "ready" = green circle + white check. */
  variant?: "captured" | "ready";
};

export function CelebrationHero({
  title,
  subtitle,
  variant = "captured",
}: CelebrationHeroProps) {
  const isReady = variant === "ready";

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="relative flex h-28 w-44 items-center justify-center">
        <RibbonConfetti />
        <span
          className={`relative flex h-20 w-20 items-center justify-center rounded-full shadow-sm ${
            isReady
              ? "bg-tennis-700 text-white shadow-md"
              : "bg-tennis-100 text-tennis-800"
          }`}
        >
          <CheckIcon className={isReady ? "h-9 w-9" : "h-10 w-10"} strokeWidth={isReady ? 2.5 : 3} />
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-xl font-semibold text-tennis-900">{title}</p>
        <p className="text-sm text-ink-muted">{subtitle}</p>
      </div>
    </div>
  );
}

// Scattered rectangles + dots in yellow and lime — matches the mockup ribbons.
function RibbonConfetti() {
  const pieces = [
    "left-[6%] top-[18%] h-2 w-5 -rotate-[28deg] rounded-[1px] bg-yellow-400",
    "left-[14%] top-[4%] h-1.5 w-3.5 rotate-[18deg] rounded-[1px] bg-lime-400",
    "right-[8%] top-[10%] h-2 w-4 rotate-[32deg] rounded-[1px] bg-lime-500",
    "right-[18%] top-[22%] h-1.5 w-4 -rotate-[12deg] rounded-[1px] bg-yellow-300",
    "left-[2%] top-[42%] h-1.5 w-3 rotate-[42deg] rounded-[1px] bg-lime-400",
    "right-[4%] top-[48%] h-2 w-5 -rotate-[35deg] rounded-[1px] bg-yellow-400",
    "left-[22%] top-[58%] h-1 w-1 rounded-full bg-lime-500",
    "right-[28%] top-[2%] h-1.5 w-1.5 rounded-full bg-yellow-400",
    "left-[38%] top-[8%] h-1 w-1 rounded-full bg-tennis-500",
    "right-[32%] top-[56%] h-1.5 w-1.5 rounded-full bg-lime-400",
    "left-[48%] top-[72%] h-1.5 w-4 rotate-[-8deg] rounded-[1px] bg-yellow-300",
    "right-[12%] top-[68%] h-1 w-1 rounded-full bg-yellow-400",
  ];

  return (
    <>
      {pieces.map((className) => (
        <span
          key={className}
          aria-hidden="true"
          className={`absolute ${className}`}
        />
      ))}
    </>
  );
}

function CheckIcon({
  className,
  strokeWidth = 2.5,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}
