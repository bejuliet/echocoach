import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { LanguageProvider } from "./lib/languagePreference";
import { MobileAppFrame } from "./components/MobileAppFrame";

// One modern sans family for the whole app — clean, readable, and mobile-friendly.
const sans = Plus_Jakarta_Sans({
  variable: "--font-sans",
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
    <html lang="en" className={`${sans.variable} h-full antialiased`}>
      {/* suppressHydrationWarning: browser extensions (e.g. Grammarly) inject
          attributes onto <body> before React hydrates, which is harmless but
          otherwise logs a hydration mismatch warning. */}
      <body
        suppressHydrationWarning
        className="min-h-dvh bg-canvas font-sans text-foreground"
      >
        <ConvexClientProvider>
          <LanguageProvider>
            <MobileAppFrame>{children}</MobileAppFrame>
          </LanguageProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
