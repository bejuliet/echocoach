"use client";

import { ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { AuthGateErrorBoundary, Stage2AuthGate } from "./components/Stage2AuthGate";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

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

  if (!clerkPublishableKey) {
    return <ConvexProvider client={convex}>{children}</ConvexProvider>;
  }
  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <AuthenticatedConvexProvider client={convex}>{children}</AuthenticatedConvexProvider>
    </ClerkProvider>
  );
}

function AuthenticatedConvexProvider({ client, children }: { client: ConvexReactClient; children: ReactNode }) {
  return <ConvexProviderWithClerk client={client} useAuth={useAuth}><AuthGateErrorBoundary><Stage2AuthGate>{children}</Stage2AuthGate></AuthGateErrorBoundary></ConvexProviderWithClerk>;
}
