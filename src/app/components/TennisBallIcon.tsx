// Small tennis-ball icon with white seam lines for the logo accent.
export function TennisBallIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient
          id="tennisBallFill"
          cx="32%"
          cy="28%"
          r="68%"
        >
          <stop offset="0%" stopColor="#f5ffd4" />
          <stop offset="45%" stopColor="#d4e838" />
          <stop offset="100%" stopColor="#96b82e" />
        </radialGradient>
      </defs>
      <circle cx="14" cy="14" r="12.5" fill="url(#tennisBallFill)" />
      {/* Classic white curved seams on a tennis ball. */}
      <path
        d="M14 2.5c4.8 3.8 7.8 7.6 7.8 11.5S18.8 22.2 14 25.5"
        stroke="white"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M14 2.5c-4.8 3.8-7.8 7.6-7.8 11.5S9.2 22.2 14 25.5"
        stroke="white"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
