export type ReviewStyle = "kids" | "teenagers" | "adults";
export const REVIEW_STYLE_OPTIONS = [
  { value: "kids", label: "Kids — Fun, Upbeat, Encouraging" },
  { value: "teenagers", label: "Teenagers — Encouraging, Constructive" },
  { value: "adults", label: "Adults — Professional, Constructive, Candid" },
] as const satisfies readonly { value: ReviewStyle; label: string }[];
