// Native share for approved class review messages.
// Uses the Web Share API on mobile; falls back to clipboard on desktop.

export type ShareOutcome = "shared" | "cancelled" | "copied";

export async function shareClassReviewMessage(
  text: string,
): Promise<ShareOutcome> {
  const body = text.trim();
  if (!body) return "cancelled";

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ text: body });
      return "shared";
    } catch (err) {
      // User dismissed the share sheet — not an error.
      if (err instanceof Error && err.name === "AbortError") {
        return "cancelled";
      }
    }
  }

  try {
    await navigator.clipboard.writeText(body);
    return "copied";
  } catch {
    return "cancelled";
  }
}
