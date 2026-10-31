"use client";

import { Component, ReactNode } from "react";
import { SignInButton, useAuth } from "@clerk/nextjs";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function Stage2AuthGate({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { isLoading: isConvexLoading, isAuthenticated } = useConvexAuth();
  const coach = useQuery(api.studentPortal.currentCoach, isSignedIn && isAuthenticated ? {} : "skip");
  if (!isLoaded || isConvexLoading || (isSignedIn && isAuthenticated && coach === undefined)) return <AuthState title="Loading EchoCoach…" message="Checking your secure Coach access." />;
  if (!isSignedIn) return <AuthState title="Sign in to EchoCoach" message="Your Coach account must be signed in before you can access Stage 2."><SignInButton mode="modal"><button className="rounded-full bg-tennis-800 px-5 py-3 text-sm font-semibold text-white">Sign in</button></SignInButton></AuthState>;
  if (!isAuthenticated || !coach) return <AuthState title="Coach account not configured" message="You are signed in, but this Clerk Development user is not registered as an active EchoCoach Coach." />;
  return <>{children}</>;
}

function AuthState({ title, message, children }: { title: string; message: string; children?: ReactNode }) {
  return <main className="flex min-h-dvh items-center justify-center bg-canvas px-6"><section className="w-full max-w-md rounded-3xl border border-line bg-card p-8 text-center shadow-sm"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-tennis-700">EchoCoach Stage 2</p><h1 className="mt-3 text-2xl font-semibold text-tennis-900">{title}</h1><p className="mt-3 text-sm leading-6 text-ink-muted">{message}</p>{children && <div className="mt-6">{children}</div>}</section></main>;
}

export class AuthGateErrorBoundary extends Component<{ children: ReactNode }, { errorMessage?: string }> {
  state: { errorMessage?: string } = {};
  static getDerivedStateFromError(error: unknown) {
    return { errorMessage: error instanceof Error ? error.message : "The secure application check failed." };
  }
  render() {
    return this.state.errorMessage
      ? <AuthState title="Unable to load EchoCoach" message={this.state.errorMessage} />
      : this.props.children;
  }
}
