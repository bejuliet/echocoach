// Centers the app in a phone-sized column on desktop (mobile-first).
// Tuned for a 390 × 844 viewport — the same size as Chrome DevTools iPhone 14 Pro.
export function MobileAppFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[390px] flex-col overflow-x-hidden bg-background">
      {children}
    </div>
  );
}
