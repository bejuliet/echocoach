// Decorative home-screen background inspired by the design mockup:
// grass court gradient, soft sun flare, a blurred tennis ball, and faint
// athlete + racket shapes. Kept subtle so text and buttons stay readable.

export function HomeCourtBackground() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      {/* Base grass gradient — lighter and sunlit at the top, deeper green below. */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#d4e8c8] via-[#6faa63] to-[#1f5f3f]" />

      {/* Fine grass texture so the fill feels like a court, not flat color. */}
      <div
        className="absolute inset-0 opacity-35"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.05) 0px,
              rgba(255, 255, 255, 0.05) 1px,
              transparent 1px,
              transparent 7px
            ),
            repeating-linear-gradient(
              0deg,
              rgba(0, 0, 0, 0.03) 0px,
              rgba(0, 0, 0, 0.03) 2px,
              transparent 2px,
              transparent 10px
            )
          `,
        }}
      />

      {/* Morning sun flare from the upper-left, like the mockup. */}
      <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(255,248,220,0.75)_0%,rgba(194,230,110,0.35)_45%,transparent_72%)] blur-sm" />

      {/* A faint court baseline to anchor the scene. */}
      <div className="absolute left-0 right-0 top-[38%] h-px bg-white/25" />
      <div className="absolute bottom-[28%] left-0 right-0 h-px bg-white/15" />

      {/* Athlete silhouette — mid-ground, low contrast so it stays calm. */}
      <svg
        viewBox="0 0 220 320"
        className="absolute right-[8%] top-[30%] h-44 w-32 text-tennis-900/25"
        fill="currentColor"
      >
        <circle cx="118" cy="42" r="18" />
        <path d="M96 62c-8 18-10 42-6 64 4 20 14 38 30 52 8 7 18 12 28 14v18c-14-2-28-10-38-20-18-16-30-38-34-62-4-24 0-50 12-72l-8-6Z" />
        <path d="M84 118c-18 8-34 24-42 42-6 14-8 30-6 46l20-4c-2-12 0-24 6-34 6-12 16-22 28-28l-6-22Z" />
        <path d="M150 88c10 6 18 16 22 28 6 16 6 34 0 50l-18-8c4-10 4-22 0-32-4-10-12-18-22-24l18-14Z" />
        <path d="M58 176c24-6 48-2 68 12 10 8 18 18 22 30l-24 10c-4-8-10-14-18-18-14-10-32-14-48-10l-0-24Z" />
      </svg>

      {/* Racket outline — upper-right accent, very soft. */}
      <svg
        viewBox="0 0 120 220"
        className="absolute -right-2 top-[18%] h-36 w-20 text-white/20"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      >
        <ellipse cx="58" cy="58" rx="34" ry="42" />
        <path d="M58 98v92" />
        <path d="M48 126h20" />
        <path d="M52 58h12M58 46v24M46 58h24" />
      </svg>

      {/* Foreground tennis ball — blurred lime glow in the lower-left. */}
      <div className="absolute bottom-32 left-5 h-24 w-24 rounded-full bg-[radial-gradient(circle_at_35%_35%,#f3ffd0_0%,#c2e66e_55%,#8fbe3f_100%)] opacity-80 blur-[1px] shadow-[0_0_40px_rgba(194,230,110,0.55)]" />
      <div className="absolute bottom-[8.5rem] left-9 h-16 w-16 rounded-full bg-lime-400/35 blur-xl" />

      {/* Bottom vignette keeps the CTA area readable. */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-tennis-900/55" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,transparent_0%,rgba(20,83,45,0.18)_100%)]" />
    </div>
  );
}
