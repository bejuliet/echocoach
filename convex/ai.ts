import { action } from "./_generated/server";
import { v } from "convex/values";

// All OpenAI calls live here, inside Convex *actions*.
// Actions are the only Convex function type allowed to talk to the outside
// world (per our project convention). Running them on the server means the
// secret OPENAI_API_KEY never reaches the browser.
//
// Before these work, set the key once:  npx convex env set OPENAI_API_KEY sk-...

const OPENAI_BASE = "https://api.openai.com/v1";

// Small helper so every function fails with a clear message if the key is missing.
function getApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error(
      "OPENAI_API_KEY is not set. Run: npx convex env set OPENAI_API_KEY sk-...",
    );
  }
  return key;
}

// Turn a chunk of recorded audio into text using OpenAI Whisper.
// The browser records audio and sends us the raw bytes plus its MIME type.
export const transcribe = action({
  args: {
    audio: v.bytes(), // raw audio data (ArrayBuffer) from the browser recorder
    mimeType: v.string(), // e.g. "audio/webm" (Chrome) or "audio/mp4" (Safari)
  },
  handler: async (_ctx, args) => {
    const apiKey = getApiKey();

    // Whisper wants a real file upload, so we wrap the bytes in a Blob and
    // give it a filename whose extension matches the recording format.
    const extension = args.mimeType.includes("mp4")
      ? "mp4"
      : args.mimeType.includes("ogg")
        ? "ogg"
        : args.mimeType.includes("wav")
          ? "wav"
          : "webm";
    const blob = new Blob([args.audio], { type: args.mimeType });

    const form = new FormData();
    form.append("file", blob, `recording.${extension}`);
    form.append("model", "whisper-1");
    form.append("language", "en");

    const res = await fetch(`${OPENAI_BASE}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Whisper transcription failed (${res.status}): ${detail}`);
    }

    const data = (await res.json()) as { text: string };
    return data.text.trim();
  },
});

// Turn the coach's four approved answers into one warm, polished review.
// `today` is passed in from the client so the date matches the coach's local
// timezone rather than the server's.
export const polish = action({
  args: {
    studentName: v.string(),
    whatWeDid: v.string(),
    progress: v.string(),
    nextSteps: v.string(),
    today: v.string(), // human-readable date, e.g. "Wednesday, June 3, 2026"
  },
  handler: async (_ctx, args) => {
    const apiKey = getApiKey();

    // The system prompt is where we lock in the tone and structure. We keep
    // the rules explicit so every message looks consistent and professional.
    const systemPrompt = [
      "You are EchoCoach, an assistant that writes post-class review messages for a tennis coach.",
      "The coach's name is Tom Tao. Write the message FROM Tom Tao TO the student or their parents.",
      "Follow these rules exactly:",
      `1. Start with the date (${args.today}) and a warm greeting that uses the student's name.`,
      "2. Use a warm, professional, and encouraging tone throughout. Sound human, not robotic.",
      "3. Naturally weave in what was covered in the class, the student's progress, and the next steps / practice.",
      "4. Keep it concise: 2-4 short paragraphs. Do not invent facts beyond what the coach provided.",
      '5. Near the end, include a friendly closing line that means "looking forward to seeing you in our next class!" but phrase it a little differently each time so it never feels copy-pasted.',
      '6. End with a sign-off on its own line: "Your Coach,\\nTom Tao".',
      "Return only the message text, with no extra commentary, labels, or markdown.",
    ].join("\n");

    const userPrompt = [
      `Student: ${args.studentName}`,
      `What we did in the class: ${args.whatWeDid}`,
      `Progress: ${args.progress}`,
      `Next steps and practice: ${args.nextSteps}`,
    ].join("\n");

    const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        // A little randomness keeps the closing line fresh each time.
        temperature: 0.8,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Message polishing failed (${res.status}): ${detail}`);
    }

    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
    };
    return data.choices[0]?.message.content.trim() ?? "";
  },
});
