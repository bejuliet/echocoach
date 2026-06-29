import type { Language } from "@/app/components/ui";

export type StepKey =
  | "studentName"
  | "whatWeDid"
  | "progress"
  | "nextSteps";

export type StepQuestion = {
  key: StepKey;
  label: string;
};

const COPY = {
  en: {
    home: {
      tagline: "Capture class notes in one calm flow.",
      newClassReview: "New Class Review",
      history: "History",
    },
    progress: {
      stepOf: (current: number, total: number) => `Step ${current} of ${total}`,
      stages: {
        listening: { label: "Listening", caption: "Capturing voice" },
        transcribing: { label: "Transcribing", caption: "Converting to text" },
        generated: { label: "Generated", caption: "Review & edit" },
        confirmed: { label: "Confirmed", caption: "Move to next" },
      },
    },
    review: {
      steps: [
        { key: "studentName", label: "What is the student's name?" },
        { key: "whatWeDid", label: "What did we do in the class?" },
        { key: "progress", label: "What was the progress?" },
        { key: "nextSteps", label: "What are the next steps and practice?" },
      ] as StepQuestion[],
      voice: {
        listening: "Listening... Speak naturally. We're capturing your notes.",
        processingAudio: "Processing audio...",
        transcribing: "Transcribing... Turning your voice into text.",
        idle: "Tap the microphone to speak, or type below.",
        placeholderDefault: "Or type your answer here...",
        placeholderStudentName: "e.g. Emma",
        looksGood: "Looks Good",
        edit: "Edit",
        micStart: "Start recording",
        micStop: "Stop recording",
        micBlocked:
          "Microphone access was blocked. Please allow it in your browser to record.",
        transcribeFailed: "Could not transcribe audio.",
      },
      captured: {
        title: "Captured!",
        subtitle: "Great! Let's move to the next one.",
        continue: "Continue",
        generating: "Writing your review message...",
      },
      ready: {
        pageTitle: "Review Ready",
        edit: "Edit",
        heroTitle: "Your message is ready!",
        heroSubtitle: "Review, edit if needed, and approve.",
        yourStudent: "Your student",
        coachSignature: "Your Coach,",
        rewriting: "Rewriting your message...",
        approveShare: "Approve & Share",
        editMessage: "Edit Message",
        regenerate: "Regenerate message",
        regenerating: "Regenerating...",
      },
      saved: {
        title: "Saved to your log",
        body: (name: string) => `Your review for ${name} is ready to share.`,
        yourStudent: "your student",
        startOver: "Start a new review",
        viewLog: "View log",
        shareCopiedNotice:
          "Message copied — paste into WeChat, Messages, or Email.",
      },
      errors: {
        generateFailed: "Could not generate the message.",
        saveFailed: "Could not save the review.",
      },
    },
    log: {
      title: "History",
      subtitle: "Every approved class review, saved for your records.",
      reviewsSaved: "Reviews saved",
      students: "Students",
      loading: "Loading your reviews...",
      empty: "No reviews yet. Your saved class reviews will appear here.",
      newClassReview: "New Class Review",
      copyMessage: "Copy message",
      copied: "Copied!",
      yourStudent: "Your student",
    },
  },
  zh: {
    home: {
      tagline: "在一个流畅的步骤中记录课后反馈。",
      newClassReview: "新建课后反馈",
      history: "历史记录",
    },
    progress: {
      stepOf: (current: number, total: number) => `第 ${current} 步，共 ${total} 步`,
      stages: {
        listening: { label: "聆听", caption: "正在录音" },
        transcribing: { label: "转写", caption: "语音转文字" },
        generated: { label: "已生成", caption: "查看并编辑" },
        confirmed: { label: "已确认", caption: "进入下一步" },
      },
    },
    review: {
      steps: [
        { key: "studentName", label: "学员姓名是什么？" },
        { key: "whatWeDid", label: "这节课我们做了什么？" },
        { key: "progress", label: "学员有哪些进步？" },
        { key: "nextSteps", label: "下一步和练习建议是什么？" },
      ] as StepQuestion[],
      voice: {
        listening: "正在聆听……请自然说话，我们会记录您的反馈。",
        processingAudio: "正在处理音频……",
        transcribing: "正在转写……正在将语音转换为文字。",
        idle: "点击麦克风说话，或在下方输入文字。",
        placeholderDefault: "或在此输入您的回答……",
        placeholderStudentName: "例如：Emily Zhang",
        looksGood: "看起来不错",
        edit: "编辑",
        micStart: "开始录音",
        micStop: "停止录音",
        micBlocked: "麦克风权限被拒绝。请在浏览器中允许访问后再试。",
        transcribeFailed: "无法转写音频。",
      },
      captured: {
        title: "已记录！",
        subtitle: "很好！让我们继续下一步。",
        continue: "继续",
        generating: "正在撰写课后反馈……",
      },
      ready: {
        pageTitle: "反馈已就绪",
        edit: "编辑",
        heroTitle: "您的反馈已准备好！",
        heroSubtitle: "请查看、按需编辑并确认。",
        yourStudent: "您的学员",
        coachSignature: "您的教练，",
        rewriting: "正在重写反馈……",
        approveShare: "确认并分享",
        editMessage: "编辑反馈",
        regenerate: "重新生成反馈",
        regenerating: "正在重新生成……",
      },
      saved: {
        title: "已保存到历史记录",
        body: (name: string) => `您为 ${name} 准备的反馈已可以分享。`,
        yourStudent: "您的学员",
        startOver: "开始新的反馈",
        viewLog: "查看历史记录",
        shareCopiedNotice: "反馈已复制 — 可粘贴到微信、短信或邮件。",
      },
      errors: {
        generateFailed: "无法生成反馈。",
        saveFailed: "无法保存反馈。",
      },
    },
    log: {
      title: "历史记录",
      subtitle: "所有已确认的课后反馈都会保存在这里。",
      reviewsSaved: "已保存反馈",
      students: "学员人数",
      loading: "正在加载反馈……",
      empty: "还没有反馈。已保存的课后反馈会显示在这里。",
      newClassReview: "新建课后反馈",
      copyMessage: "复制反馈",
      copied: "已复制！",
      yourStudent: "您的学员",
    },
  },
} as const;

export function getCopy(language: Language) {
  return COPY[language];
}

export function getStepQuestions(language: Language): StepQuestion[] {
  return COPY[language].review.steps;
}

// Full date string passed to the AI polish action (matches coach local timezone).
export function formatToday(language: Language): string {
  const locale = language === "zh" ? "zh-CN" : "en-US";
  return new Date().toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Shorter date shown on message/history cards.
export function formatCardDate(language: Language, timestamp: number): string {
  const locale = language === "zh" ? "zh-CN" : "en-US";
  return new Date(timestamp).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
