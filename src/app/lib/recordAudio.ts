// Voice capture helpers. iOS Safari's MediaRecorder mp4 output is often rejected
// by Whisper, so Apple devices record PCM and encode a standard WAV file instead.

export type RecordingSession = {
  stop: () => Promise<{ blob: Blob; mimeType: string }>;
};

export function isAppleDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export async function startRecording(): Promise<RecordingSession> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  if (isAppleDevice()) return startWavRecording(stream);
  return startMediaRecorder(stream);
}

// --- WAV path (iPhone / iPad / Safari) ------------------------------------

async function startWavRecording(stream: MediaStream): Promise<RecordingSession> {
  const audioContext = new AudioContext();
  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  const source = audioContext.createMediaStreamSource(stream);
  // ScriptProcessor is widely supported on iOS; AudioWorklet is not always available.
  const processor = audioContext.createScriptProcessor(4096, 1, 1);
  const silentGain = audioContext.createGain();
  silentGain.gain.value = 0;

  const sampleRate = audioContext.sampleRate;
  const chunks: Float32Array[] = [];
  let capturing = true;

  processor.onaudioprocess = (event) => {
    if (!capturing) return;
    chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
  };

  source.connect(processor);
  processor.connect(silentGain);
  silentGain.connect(audioContext.destination);

  function cleanupTracks() {
    stream.getTracks().forEach((track) => track.stop());
  }

  function disconnectGraph() {
    processor.disconnect();
    source.disconnect();
    silentGain.disconnect();
  }

  return {
    stop: async () => {
      capturing = false;
      disconnectGraph();
      cleanupTracks();
      await audioContext.close();

      const totalSamples = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const merged = new Float32Array(totalSamples);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }

      return {
        blob: encodeWav(merged, sampleRate),
        mimeType: "audio/wav",
      };
    },
  };
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let writeOffset = 44;
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i] ?? 0));
    view.setInt16(
      writeOffset,
      clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff,
      true,
    );
    writeOffset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function writeAscii(view: DataView, offset: number, text: string) {
  for (let i = 0; i < text.length; i++) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}

// --- MediaRecorder path (desktop / Android Chrome) ------------------------

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = ["audio/webm", "audio/mp4", "audio/ogg"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

async function startMediaRecorder(stream: MediaStream): Promise<RecordingSession> {
  const mimeType = pickMimeType();
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks: Blob[] = [];

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  const started = new Promise<void>((resolve, reject) => {
    recorder.onstart = () => resolve();
    recorder.onerror = () => reject(new Error("Recording failed"));
    recorder.start(250);
  });
  await started;

  return {
    stop: async () => {
      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        if (recorder.state === "recording") {
          recorder.requestData();
          recorder.stop();
        } else {
          resolve();
        }
      });

      stream.getTracks().forEach((track) => track.stop());
      const type = recorder.mimeType || mimeType || "audio/webm";
      return {
        blob: new Blob(chunks, { type }),
        mimeType: type.includes("webm") ? "audio/webm" : type,
      };
    },
  };
}
