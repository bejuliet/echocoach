# EchoCoach Design System

The visual foundation for EchoCoach — a tennis-green, mobile-first design system
built from the PRD, the Design Guideline, and `Design Concept.png`.

This document is the human-readable companion to the **live styleguide** at
`/design-system` (source: `src/app/design-system/page.tsx`). Open that route to
see and click every component described below.

> **Scope:** This is the design *foundation* only. Tokens and components are
> additive — the existing app pages (home wizard, log) are unchanged except for
> a single quiet footer link to the styleguide. Re-skinning the real pages to
> the green theme is a separate, later step.

## Guiding principles

Every decision below maps back to a guideline principle:

| Principle | How the system honors it |
| --- | --- |
| **Mobile-first** | Components are full-width, stacked, and sized for small screens first. |
| **Tennis green theme** | A green brand scale + lime accent + court gradient. |
| **Rounded corners** | Buttons `rounded-2xl`, cards `rounded-3xl`, pills `rounded-full`. |
| **Outdoor readability** | High-contrast ink on light surfaces, large type, bold weights. |
| **Large touch targets** | Buttons are ≥ 44px (md) and ≥ 56px (lg); icon buttons are 44px. |
| **One-handed operation** | Primary actions live in a bottom thumb-zone pill (`BottomBar`). |
| **Warm & encouraging tone** | Soft shadows, friendly copy, gentle greens (not clinical). |
| **Bilingual-ready** | `LanguageSelector` (EN / 中文) is part of the foundation. |

---

## 1. Color palette

Defined as CSS variables in `src/app/globals.css` and exposed to Tailwind, so
utilities like `bg-tennis-700` and `text-ink` work directly.

### Brand greens
| Token | Hex | Usage |
| --- | --- | --- |
| `tennis-50` | `#f0f7f1` | Lightest tint, subtle backgrounds |
| `tennis-100` | `#dcefe1` | Soft fills, selected/done states |
| `tennis-200` | `#bfe0c8` | Borders on green surfaces |
| `tennis-500` | `#3aae5f` | Success / confirmation |
| `tennis-600` | `#2e7d52` | Primary button **hover** |
| `tennis-700` | `#1f7a4d` | **Primary brand + main buttons** |
| `tennis-800` | `#166534` | Pressed / active, strong text |
| `tennis-900` | `#14532d` | Deepest green, max contrast |

### Accent (use sparingly)
| Token | Hex | Usage |
| --- | --- | --- |
| `lime-400` | `#c2e66e` | Tennis-ball highlight |
| `lime-500` | `#a8d84b` | Tennis-ball accent |

### Gradient & neutrals
| Token | Hex | Usage |
| --- | --- | --- |
| `court-from` → `court-to` | `#e8f3e2` → `#cfe6c4` | Home hero "court" gradient |
| `ink` | `#1c2b22` | Primary text |
| `ink-muted` | `#5c6b62` | Secondary text |
| `line` | `#e2e8e3` | Hairline borders |
| `card` | `#ffffff` | Card surfaces |
| `canvas` | `#f4f8f3` | Page background |

**Outdoor-readability note:** `ink` on `canvas`/`card` and white on `tennis-700`
both clear the WCAG AA contrast bar (4.5:1) for body text, so the app stays
legible in bright sunlight. Reserve lime for small accents only — it does *not*
have enough contrast for text.

---

## 2. Typography system

- **Display & headings:** Source Serif 4 (`font-serif`, already loaded in
  `layout.tsx`) — gives EchoCoach its warm, classic feel.
- **Body & UI:** system sans (`font-sans`) — crisp and readable at small sizes.

| Role | Font | Size | Weight |
| --- | --- | --- | --- |
| Display | Serif | 30px (`text-3xl`) | Bold |
| Heading | Serif | 20px (`text-xl`) | Semibold |
| Body | Sans | 16px (`text-base`) | Regular |
| Caption | Sans | 14px (`text-sm`) | Regular, `ink-muted` |

---

## 3. Button hierarchy

Component: `src/app/components/ui/Button.tsx`

| Variant | Look | When to use |
| --- | --- | --- |
| `primary` | Solid `tennis-700`, white text, shadow | The one main action on a screen |
| `secondary` | White, green border + text | Secondary action beside a primary |
| `ghost` | Text only, green | Low-emphasis inline actions |
| `danger` | Muted text | Cancel / dismiss |

**Sizes:** `lg` (≥ 56px, full-width default — the bottom CTA) and `md` (≥ 44px).
**States:** `loading` (inline spinner, click-blocked) and `disabled`.

```tsx
import { Button } from "@/app/components/ui";

<Button variant="primary" size="lg" icon={<Mic />}>Record voice</Button>
<Button variant="secondary">Regenerate</Button>
<Button variant="danger" size="md">Cancel</Button>
<Button loading>Saving…</Button>
```

---

## 4. Card styles

Component: `src/app/components/ui/Card.tsx` (+ `CardHeader`, `CardTitle`,
`CardSubtitle`). Rounded-3xl, soft shadow, `line` border, white surface.

- **Question card** — prompt text on a clean surface.
- **Message card** — `CardHeader` with an avatar + date, then the body.
- **Stat card** — `padding="sm"` with a big number + label (dashboard).

```tsx
import { Card, CardHeader, CardTitle, CardSubtitle } from "@/app/components/ui";

<Card>
  <CardHeader leading={<Avatar />}>
    <CardTitle>Coach Tom</CardTitle>
    <CardSubtitle>June 9, 2026</CardSubtitle>
  </CardHeader>
  <p>Great session today…</p>
</Card>
```

---

## 5. Spacing system

Based on a **4px unit** (Tailwind's default scale).

| Step | Value | Typical use |
| --- | --- | --- |
| xs | 4px | Icon/text nudges |
| sm | 8px | Tight gaps |
| md | 16px | Stack gaps between elements |
| lg | 24px | Section spacing |
| xl | 32px | Major section breaks |

- **Screen padding:** 20px (`px-5`) on phones.
- **Touch targets:** ≥ 44px tall.
- **Thumb zone:** keep the primary action near the bottom for one-handed use.

---

## 6. Progress indicator

Component: `src/app/components/ui/ProgressIndicator.tsx`

- **`StepBar`** — "Step X of N" with a segmented filled bar. Shows which of the
  four questions the coach is on.
- **`StageTracker`** — the four capture stages for a single question:
  **Listening → Transcribing → Generated → Confirmed**, with a numbered/check
  state for done, active, and upcoming.

```tsx
import { StepBar, StageTracker } from "@/app/components/ui";

<StepBar current={2} total={4} />
<StageTracker active="transcribing" />
```

---

## 7. Navigation

Component: `src/app/components/ui/BottomBar.tsx` (+ `BottomBarAction`,
`PageHeader`).

- **`BottomBar`** — a floating, sticky pill in the bottom thumb zone holding the
  primary action and round icon actions (e.g. History). Drives one-handed use.
- **`PageHeader`** — top bar with an optional back arrow, centered title, and an
  optional trailing action (e.g. Edit) for intake/message screens.

```tsx
import { BottomBar, BottomBarAction, PageHeader, Button } from "@/app/components/ui";

<PageHeader title="Class Review" onBack={goBack} action={<Button variant="ghost" size="md">Edit</Button>} />

<BottomBar>
  <BottomBarAction icon={<Mic />} label="Record" />
  <Button size="md">New review</Button>
  <BottomBarAction icon={<List />} label="History" />
</BottomBar>
```

---

## 8. Language selector

Component: `src/app/components/ui/LanguageSelector.tsx`

EN / 中文 picker with a globe icon, built on a native `<select>` for solid
mobile accessibility. **Controlled** via `value` / `onChange`; English is the
default. UI only — it reports the choice but does not translate the app yet.

```tsx
import { LanguageSelector, type Language } from "@/app/components/ui";

const [lang, setLang] = useState<Language>("en");
<LanguageSelector value={lang} onChange={setLang} />
```

---

## Using the system

All components are exported from a single barrel:

```tsx
import { Button, Card, StepBar, BottomBar, LanguageSelector } from "@/app/components/ui";
```

Tokens are global — any Tailwind color utility built from the names in section 1
(`bg-tennis-700`, `text-ink`, `border-line`, etc.) is available everywhere.
