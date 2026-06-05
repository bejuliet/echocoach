"use client";

import { ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

// Created once at module load when the deployment URL is available.
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  // Before you run `npx convex dev`, NEXT_PUBLIC_CONVEX_URL is unset.
  // Render the app without the provider so the dev server still works.
  if (!convex) {
    if (typeof window !== "undefined") {
      console.warn(
        "NEXT_PUBLIC_CONVEX_URL is not set. Run `npx convex dev` to connect your Convex backend.",
      );
    }
    return <>{children}</>;
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
