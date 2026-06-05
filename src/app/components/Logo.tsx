// EchoCoach logo: a minimalist hand-held speaker (megaphone) with sound waves.
// It is drawn with `currentColor`, so wherever you use it the icon takes the
// surrounding text color. Pass a Tailwind size like `h-9 w-9` via className.
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* The megaphone cone (the "speaker" mouth). */}
      <path d="M9 19 L26 12 a2 2 0 0 1 3 1.8 V34.2 a2 2 0 0 1 -3 1.8 L9 29 Z" />
      {/* The body / chamber where the cone meets the handle. */}
      <path d="M9 19 H7 a3 3 0 0 0 -3 3 v4 a3 3 0 0 0 3 3 H9 Z" />
      {/* The hand-held handle underneath. */}
      <path d="M13 30 v4 a2.5 2.5 0 0 0 2.5 2.5 H17 a2.5 2.5 0 0 0 2.5 -2.5 V32" />
      {/* Two sound waves echoing out of the speaker. */}
      <path d="M34 18 a8 8 0 0 1 0 12" />
      <path d="M38 14 a14 14 0 0 1 0 20" />
    </svg>
  );
}
