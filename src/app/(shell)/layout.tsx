import Link from "next/link";
import { Logo } from "../components/Logo";

// Shared chrome for the working app screens (review, log, design system).
// The home page lives outside this group so it can be full-screen like the mockup.
export default function ShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <header className="border-b border-border bg-surface/80 backdrop-blur">
        <nav className="flex w-full items-center justify-between px-5 py-4">
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
              href="/review"
              className="rounded-full px-4 py-2 text-muted transition-colors hover:bg-accent-soft hover:text-accent"
            >
              New review
            </Link>
            <Link
              href="/"
              className="rounded-full px-4 py-2 text-muted transition-colors hover:bg-accent-soft hover:text-accent"
            >
              Home
            </Link>
          </div>
        </nav>
      </header>
      <main className="w-full flex-1 overflow-y-auto px-5 py-8">{children}</main>
    </>
  );
}
