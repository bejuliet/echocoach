# EchoCoach

**Coach, Capture, Connect.**

EchoCoach lets a tennis coach speak their notes after a class. It transcribes
the voice (OpenAI Whisper), then turns four short answers into a warm,
professional review message (OpenAI GPT) that gets saved to a log to share with
students or parents.

Built with **Next.js** (App Router + TypeScript + Tailwind) and **Convex**
(reactive backend + database). All AI calls run server-side inside Convex
actions, so your OpenAI key never reaches the browser.

## Prerequisites

This project needs **Node.js 18.18+** (it was set up with Node 24 LTS via `nvm`). If you open a fresh terminal, make sure the right Node is active:

```bash
nvm use default   # selects the Node LTS installed via nvm
node --version     # should print v24.x (or any 18.18+)
```

## First-time setup

Dependencies are already installed. The one remaining step is connecting the Convex backend:

```bash
npx convex dev
```

This will:

1. Open your browser to **log in / create a free Convex account**.
2. Create a development deployment for this project.
3. Write your deployment URL into `.env.local` as `NEXT_PUBLIC_CONVEX_URL`.
4. Generate the `convex/_generated/` types used by the app.

Leave that command running — it watches the `convex/` folder and pushes changes automatically.

### Add your OpenAI key

EchoCoach uses one OpenAI key for **both** voice transcription (Whisper) and
message polishing (GPT). Create a key at
[platform.openai.com](https://platform.openai.com) (you'll need to pre-pay a
little credit — usage is roughly 2-3 cents per completed review), then store it
as a Convex environment variable so it stays server-side:

```bash
npx convex env set OPENAI_API_KEY sk-...your-key...
```

## Run the app

In a **second terminal**, start the Next.js dev server:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

> Note: `npm run dev` works on its own, but Convex queries/mutations only function after you've run `npx convex dev` (so the deployment URL exists). Until then the app loads without a live backend.

## Project structure

```
convex/                  # Backend: schema + serverless functions
  schema.ts              # Data model (the `reviews` table)
  reviews.ts             # list query + create mutation for saved reviews
  ai.ts                  # Actions: transcribe (Whisper) + polish (GPT)
src/app/
  layout.tsx             # App shell: serif font, top nav, ConvexClientProvider
  ConvexClientProvider.tsx  # Connects the frontend to Convex
  page.tsx               # Feature page: the 4-step voice review wizard
  log/page.tsx           # Log page: dashboard + saved reviews
  components/
    Logo.tsx             # Hand-held speaker logo (SVG)
    VoiceInput.tsx       # Reusable record -> transcribe -> edit -> approve block
  icon.svg               # Favicon
.cursor/rules/convex.mdc # Project rule so the AI follows Convex conventions
```

## Useful commands

| Command          | What it does                                  |
| ---------------- | --------------------------------------------- |
| `npx convex dev` | Run/watch the Convex backend (log in first)   |
| `npm run dev`    | Start the Next.js dev server                  |
| `npm run build`  | Production build (run `npx convex dev` first) |
| `npm run lint`   | Lint the codebase                             |

## Docs

- Convex: https://docs.convex.dev/home
- Next.js: https://nextjs.org/docs
