import type { Metadata } from "next";
import { Source_Serif_4 } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { Logo } from "./components/Logo";

// One classic serif family powers the whole app. We expose it as a CSS
// variable (--font-serif) so globals.css can use it as the default body font.
const serif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EchoCoach - Coach, Capture, Connect",
  description:
    "Capture a coach's spoken notes after class and turn them into a warm, professional review message.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${serif.variable} h-full antialiased`}>
      {/* suppressHydrationWarning: browser extensions (e.g. Grammarly) inject
          attributes onto <body> before React hydrates, which is harmless but
          otherwise logs a hydration mismatch warning. */}
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-background text-foreground"
      >
        <ConvexClientProvider>
          {/* Slim top navigation shared across every page. */}
          <header className="border-b border-border bg-surface/80 backdrop-blur">
            <nav className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
              <Link href="/" className="flex items-center gap-3">
                <Logo className="h-9 w-9 text-accent" />
                <span className="flex flex-col leading-tight">
                  <span className="text-xl font-semibold tracking-tight">
                    EchoCoach
                  </span>
                  <span className="text-xs text-muted">
                    Coach, Capture, Connect.
                  </span>
                </span>
              </Link>
              <div className="flex items-center gap-1 text-sm">
                <Link
                  href="/"
                  className="rounded-full px-4 py-2 text-muted transition-colors hover:bg-accent-soft hover:text-accent"
                >
                  New review
                </Link>
                <Link
                  href="/log"
                  className="rounded-full px-4 py-2 text-muted transition-colors hover:bg-accent-soft hover:text-accent"
                >
                  Log
                </Link>
              </div>
            </nav>
          </header>
          <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
            {children}
          </main>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
