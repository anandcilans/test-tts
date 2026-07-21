"use client";

import { Formik, Form, Field, ErrorMessage } from "formik";
import { useRef, useState } from "react";
import { ttsSchema, type TtsFormValues } from "@/schemas/ttsSchema";

const TTS_URL = process.env.NEXT_PUBLIC_TTS_URL ?? "http://localhost:8000";

const LANGUAGES = [
  { value: "hi-IN", label: "Hindi" },
  { value: "en-IN", label: "English (India)" },
  { value: "bn-IN", label: "Bengali" },
  { value: "ta-IN", label: "Tamil" },
  { value: "te-IN", label: "Telugu" },
  { value: "kn-IN", label: "Kannada" },
  { value: "ml-IN", label: "Malayalam" },
  { value: "mr-IN", label: "Marathi" },
  { value: "gu-IN", label: "Gujarati" },
  { value: "pa-IN", label: "Punjabi" },
];

const SPEAKERS = [
  { value: "shubh", label: "Shubh" },
  { value: "priya", label: "Priya" },
  { value: "rohan", label: "Rohan" },
  { value: "kavya", label: "Kavya" },
];

const initialValues: TtsFormValues = {
  text: "मेरे शहर में बहुत सी बारिश आती है।",
  target_language_code: "hi-IN",
  speaker: "shubh",
};

function Waveform() {
  const heights = [18, 34, 52, 28, 64, 40, 22, 58, 36, 70, 30, 48, 24, 60, 38];
  return (
    <div
      className="flex h-40 items-end justify-center gap-1.5 opacity-70 sm:h-52 sm:gap-2"
      aria-hidden
    >
      {heights.map((height, index) => (
        <span
          key={index}
          className="wave-bar w-1.5 rounded-sm bg-accent/80 sm:w-2"
          style={{
            height: `${height}%`,
            animationDelay: `${index * 0.08}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const previousUrl = useRef<string | null>(null);

  async function generateSpeech(values: TtsFormValues) {
    setApiError(null);

    const response = await fetch(`${TTS_URL}/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Needed when the backend is exposed via ngrok free tunnels
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({
        text: values.text,
        target_language_code: values.target_language_code,
        speaker: values.speaker,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || "TTS request failed");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    if (previousUrl.current) {
      URL.revokeObjectURL(previousUrl.current);
    }
    previousUrl.current = url;
    setAudioUrl(url);
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-drift">
        <div className="absolute -left-24 top-[-10%] h-[55vh] w-[55vh] rounded-full bg-[radial-gradient(circle,var(--glow),transparent_70%)]" />
        <div className="absolute bottom-[-15%] right-[-10%] h-[60vh] w-[60vh] rounded-full bg-[radial-gradient(circle,rgba(36,53,50,0.12),transparent_68%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(160deg,#eef3f2_0%,#e4ecea_45%,#dce8e5_100%)]" />
      </div>
      <div className="grain absolute inset-0" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-10 sm:px-10 sm:py-14">
        <header className="animate-rise">
          <p
            className="font-[family-name:var(--font-display)] text-5xl tracking-tight text-ink sm:text-7xl"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            Vāṇī
          </p>
          <h1 className="mt-4 max-w-xl text-2xl font-medium leading-snug text-ink-soft sm:text-3xl">
            Speak any line in a natural Indian voice.
          </h1>
          <p className="mt-3 max-w-md text-base text-ink-soft/80">
            Powered by Sarvam Bulbul v3 — type, generate, listen.
          </p>
        </header>

        <div className="animate-rise-delay mt-8 sm:mt-10">
          <Waveform />
        </div>

        <section className="animate-rise-delay-2 mt-8 flex-1 sm:mt-10">
          <Formik
            initialValues={initialValues}
            validationSchema={ttsSchema}
            onSubmit={async (values, helpers) => {
              try {
                await generateSpeech(values);
              } catch (error) {
                setApiError(
                  error instanceof Error ? error.message : "Something went wrong",
                );
              } finally {
                helpers.setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting, values }) => (
              <Form className="space-y-6" noValidate>
                <div>
                  <label
                    htmlFor="text"
                    className="mb-2 block text-sm font-semibold tracking-wide text-ink-soft"
                  >
                    Text
                  </label>
                  <Field
                    as="textarea"
                    id="text"
                    name="text"
                    rows={5}
                    className="w-full resize-y border border-[var(--line)] bg-paper/80 px-4 py-3 text-base text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    placeholder="Type what you want spoken…"
                  />
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <ErrorMessage name="text">
                      {(message) => (
                        <p className="text-sm text-red-700" role="alert">
                          {message}
                        </p>
                      )}
                    </ErrorMessage>
                    <p className="ml-auto text-xs text-ink-soft/60">
                      {values.text.length}/2500
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="target_language_code"
                      className="mb-2 block text-sm font-semibold tracking-wide text-ink-soft"
                    >
                      Language
                    </label>
                    <Field
                      as="select"
                      id="target_language_code"
                      name="target_language_code"
                      className="w-full border border-[var(--line)] bg-paper/80 px-4 py-3 text-base text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    >
                      {LANGUAGES.map((language) => (
                        <option key={language.value} value={language.value}>
                          {language.label}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage name="target_language_code">
                      {(message) => (
                        <p className="mt-1 text-sm text-red-700" role="alert">
                          {message}
                        </p>
                      )}
                    </ErrorMessage>
                  </div>

                  <div>
                    <label
                      htmlFor="speaker"
                      className="mb-2 block text-sm font-semibold tracking-wide text-ink-soft"
                    >
                      Voice
                    </label>
                    <Field
                      as="select"
                      id="speaker"
                      name="speaker"
                      className="w-full border border-[var(--line)] bg-paper/80 px-4 py-3 text-base text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    >
                      {SPEAKERS.map((speaker) => (
                        <option key={speaker.value} value={speaker.value}>
                          {speaker.label}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage name="speaker">
                      {(message) => (
                        <p className="mt-1 text-sm text-red-700" role="alert">
                          {message}
                        </p>
                      )}
                    </ErrorMessage>
                  </div>
                </div>

                {apiError ? (
                  <p className="text-sm text-red-700" role="alert">
                    {apiError}
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-accent px-7 py-3 text-sm font-semibold tracking-wide text-paper transition hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Generating…" : "Generate speech"}
                  </button>

                  {audioUrl ? (
                    <a
                      href={audioUrl}
                      download="vani-speech.wav"
                      className="text-sm font-semibold text-accent underline-offset-4 hover:underline"
                    >
                      Download WAV
                    </a>
                  ) : null}
                </div>

                {audioUrl ? (
                  <div className="border-t border-[var(--line)] pt-6">
                    <p className="mb-3 text-sm font-semibold tracking-wide text-ink-soft">
                      Preview
                    </p>
                    <audio
                      key={audioUrl}
                      controls
                      src={audioUrl}
                      className="w-full"
                    >
                      Your browser does not support audio playback.
                    </audio>
                  </div>
                ) : null}
              </Form>
            )}
          </Formik>
        </section>
      </div>
    </main>
  );
}
