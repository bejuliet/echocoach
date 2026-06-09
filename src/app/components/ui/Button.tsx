// EchoCoach design-system Button.
// One button to cover the whole hierarchy. Mobile-first: big touch targets,
// rounded corners, soft shadow, and high-contrast tennis-green colors so it
// stays readable outdoors. Presentational only - it just renders a <button>.
import type { ButtonHTMLAttributes, ReactNode } from "react";

// The visual styles a button can take, ranked by importance.
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
// Two sizes; both keep a comfortable, thumb-friendly tap area.
type ButtonSize = "lg" | "md";

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretch to the full width of the container (great for bottom CTAs). */
  fullWidth?: boolean;
  /** Optional icon shown before the label. */
  icon?: ReactNode;
  /** Shows a spinner and blocks clicks while an action is running. */
  loading?: boolean;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

// Shared base styles for every button.
const base =
  "inline-flex items-center justify-center gap-2 rounded-2xl font-medium " +
  "transition-all duration-150 active:scale-[0.98] focus:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-tennis-700/40 " +
  "disabled:pointer-events-none disabled:opacity-50";

// Variant-specific colors.
const variants: Record<ButtonVariant, string> = {
  // The main call to action. Solid green, white text, lifted with a shadow.
  primary: "bg-tennis-700 text-white shadow-md hover:bg-tennis-600",
  // A softer choice that sits next to a primary button.
  secondary:
    "bg-card text-tennis-800 border border-tennis-200 shadow-sm hover:bg-tennis-50",
  // Lowest emphasis: looks like a tappable label.
  ghost: "bg-transparent text-tennis-800 hover:bg-tennis-50",
  // For cautious actions like Cancel.
  danger: "bg-transparent text-ink-muted hover:bg-tennis-50",
};

// Size controls height (touch target) and horizontal padding.
const sizes: Record<ButtonSize, string> = {
  lg: "min-h-14 px-7 text-base", // ~56px tall - the primary on-screen action
  md: "min-h-11 px-5 text-sm", // ~44px tall - the minimum comfortable target
};

export function Button({
  variant = "primary",
  size = "lg",
  fullWidth = false,
  icon,
  loading = false,
  disabled,
  children,
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button
      // While loading we also disable so it can't be double-tapped.
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      {...rest}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
}

// A tiny inline spinner so we don't need an icon library.
function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}
