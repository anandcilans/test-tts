import type { TtsFormValues } from "@/schemas/ttsSchema";

const fieldMap = {
  text: "text",
  target_language_code: "target_language_code",
  speaker: "speaker",
} as const;

function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_TTS_URL ?? "http://localhost:8000").replace(
    /\/$/,
    "",
  );
}

export async function synthesizeSpeech(values: TtsFormValues): Promise<Blob> {
  const body: Record<string, string> = {};
  for (const [formKey, apiKey] of Object.entries(fieldMap)) {
    body[apiKey] = values[formKey as keyof TtsFormValues];
  }

  const response = await fetch(`${getApiBaseUrl()}/tts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const payload = (await response.json()) as { detail?: string };
      if (payload.detail) detail = payload.detail;
    } catch {
      // keep status message
    }
    throw new Error(detail);
  }

  return response.blob();
}
