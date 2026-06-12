import { action } from "./_generated/server";
import { ConvexError, v } from "convex/values";

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
    language: v.union(v.literal("en"), v.literal("zh")),
  },
  handler: async (_ctx, args) => {
    const meta = {
      byteLength: args.audio.byteLength,
      mimeType: args.mimeType,
      language: args.language,
    };

    // #region agent log
    console.log("[transcribe] start", meta);
    // #endregion

    try {
      const apiKey = getApiKey();

      if (args.audio.byteLength === 0) {
        throw new ConvexError({
          ...meta,
          message:
            "Audio recording was empty. On iPhone, hold the mic button a moment longer, then try again.",
        });
      }

      const normalizedMime = normalizeMimeType(args.mimeType);
      const extension = extensionForMime(normalizedMime);
      const blob = new Blob([args.audio], { type: normalizedMime });

      const form = new FormData();
      form.append("file", blob, `recording.${extension}`);
      form.append("model", "whisper-1");
      form.append("language", whisperLanguage(args.language));

      const res = await fetch(`${OPENAI_BASE}/audio/transcriptions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      });

      if (!res.ok) {
        const detail = await res.text();
        // #region agent log
        console.error("[transcribe] whisper failed", res.status, detail);
        // #endregion
        throw new ConvexError({
          ...meta,
          message: `Whisper transcription failed (${res.status})`,
        });
      }

      const data = (await res.json()) as { text: string };
      return data.text.trim();
    } catch (err) {
      if (err instanceof ConvexError) throw err;
      // #region agent log
      console.error("[transcribe] unexpected error", err);
      // #endregion
      const message =
        err instanceof Error ? err.message : "Transcription failed unexpectedly";
      throw new ConvexError({ ...meta, message });
    }
  },
});

function normalizeMimeType(mimeType: string): string {
  const mime = mimeType.toLowerCase();
  if (mime.includes("mp4") || mime.includes("m4a")) return "audio/mp4";
  if (mime.includes("webm")) return "audio/webm";
  if (mime.includes("ogg")) return "audio/ogg";
  if (mime.includes("wav")) return "audio/wav";
  return mimeType || "audio/mp4";
}

function whisperLanguage(language: "en" | "zh"): string {
  return language === "zh" ? "zh" : "en";
}

function extensionForMime(mimeType: string): string {
  const mime = mimeType.toLowerCase();
  if (mime.includes("mp4") || mime.includes("m4a")) return "m4a";
  if (mime.includes("caf")) return "caf";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("wav")) return "wav";
  return "webm";
}

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
    language: v.union(v.literal("en"), v.literal("zh")),
  },
  handler: async (_ctx, args) => {
    const apiKey = getApiKey();

    const systemPrompt =
      args.language === "zh"
        ? buildChineseSystemPrompt(args.today, args.studentName)
        : buildEnglishSystemPrompt(args.today);

    const userPrompt = buildUserPrompt(args);

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

function buildUserPrompt(args: {
  studentName: string;
  whatWeDid: string;
  progress: string;
  nextSteps: string;
  language: "en" | "zh";
}): string {
  if (args.language === "zh") {
    return [
      `学员姓名（必须原样保留，不得翻译或音译）：${args.studentName}`,
      `本节课内容（原文，可能中英混合）：${args.whatWeDid}`,
      `学员进步（原文，可能中英混合）：${args.progress}`,
      `下一步与练习（原文，可能中英混合）：${args.nextSteps}`,
      "",
      "写作要求：",
      "- 用简体中文撰写完整课后反馈；",
      `- 学员姓名必须逐字使用「${args.studentName}」，不得翻译、音译或改写；`,
      "- 教练署名 Tom Tao 保持原样；",
      "- 上述 Q2–Q4 原文若含英文句子或中英混合，请把叙述内容改写为中文，但拉丁字母专有名词（尤其是学员姓名）保持原拼写；",
      "- 最终正文不得保留英文句子（专有名词除外）。",
    ].join("\n");
  }

  return [
    `Student: ${args.studentName}`,
    `What we did in the class: ${args.whatWeDid}`,
    `Progress: ${args.progress}`,
    `Next steps and practice: ${args.nextSteps}`,
  ].join("\n");
}

function buildEnglishSystemPrompt(today: string): string {
  return [
    "You are EchoCoach, an assistant that writes post-class review messages for a tennis coach.",
    "The coach's name is Tom Tao. Write the message FROM Tom Tao TO the student or their parents.",
    "Follow these rules exactly:",
    `1. Start with the date (${today}) and a warm greeting that uses the student's name.`,
    "2. Use a warm, professional, and encouraging tone throughout. Sound human, not robotic.",
    "3. Naturally weave in what was covered in the class, the student's progress, and the next steps / practice.",
    "4. Keep it concise: 2-4 short paragraphs. Do not invent facts beyond what the coach provided.",
    '5. Near the end, include a friendly closing line that means "looking forward to seeing you in our next class!" but phrase it a little differently each time so it never feels copy-pasted.',
    '6. End with a sign-off on its own line: "Your Coach,\\nTom Tao".',
    "Return only the message text, with no extra commentary, labels, or markdown.",
  ].join("\n");
}

function buildChineseSystemPrompt(today: string, studentName: string): string {
  return [
    "你是 EchoCoach，一位帮助网球教练撰写课后反馈的助手。",
    "教练的名字是 Tom Tao。请以 Tom Tao 的身份，向学员或其家长撰写反馈。",
    "请严格遵循以下规则：",
    `1. 以日期（${today}）和包含学员姓名的温暖问候开头。`,
    `2. 学员姓名必须逐字使用「${studentName}」——逐字复制，不得翻译、音译、本地化或改成中文名。`,
    "3. 全文叙述必须使用简体中文。不得保留英文句子；唯一允许出现的拉丁字母是学员姓名、Tom Tao，以及教练笔记中的其他拉丁字母专有名词（保持原拼写）。",
    "4. 教练提供的 Q2–Q4 笔记可能是中英混合的原文。请将所有叙述内容改写为流畅的中文，但其中的拉丁字母专有名词（尤其是学员姓名）保持原样。",
    "5. 自然融入本节课内容、学员进步以及下一步练习建议。",
    "6. 保持简洁：2-4 个短段落。不要编造教练未提供的信息。",
    "7. 在结尾附近加入一句关于期待下次见面的友好结语，每次措辞略有不同。",
    '8. 最后一行单独署名："您的教练，\\nTom Tao"。',
    "只返回反馈正文，不要附加说明、标签或 Markdown。",
  ].join("\n");
}
