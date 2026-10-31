"use client";

import { Show, SignInButton, SignOutButton, UserButton } from "@clerk/nextjs";

export function AuthControls() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <span className="text-xs text-muted">Authentication not configured</span>;
  }
  return (
    <div className="flex items-center gap-2">
      <Show when="signed-out"><SignInButton mode="modal"><button className="rounded-full bg-accent px-4 py-2 text-sm text-white">Sign in</button></SignInButton></Show>
      <Show when="signed-in"><UserButton /><SignOutButton><button className="text-sm text-muted hover:text-accent">Sign out</button></SignOutButton></Show>
    </div>
  );
}
