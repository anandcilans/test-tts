"use client";

import { Formik, Form, Field, type FieldProps } from "formik";
import { useEffect, useRef, useState } from "react";
import { LANGUAGE_OPTIONS, SPEAKER_OPTIONS } from "@/lib/ttsOptions";
import { synthesizeSpeech } from "@/lib/synthesizeSpeech";
import {
  ttsInitialValues,
  ttsSchema,
  type TtsFormValues,
} from "@/schemas/ttsSchema";

export default function TtsStudio() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    };
  }, []);

  async function handleSubmit(values: TtsFormValues) {
    setSubmitError(null);
    try {
      const blob = await synthesizeSpeech(values);
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      const nextUrl = URL.createObjectURL(blob);
      audioUrlRef.current = nextUrl;
      setAudioUrl(nextUrl);
    } catch (error) {
      setAudioUrl(null);
      setSubmitError(
        error instanceof Error ? error.message : "Could not generate speech",
      );
    }
  }

  return (
    <div className="studio">
      <header className="studio-brand">
        <p className="studio-mark">Vāṇī</p>
        <h1 className="studio-title">Voice, shaped with care.</h1>
        <p className="studio-lede">
          Write in any Indian language. Choose a speaker. Hear Bulbul v3 speak
          it back.
        </p>
      </header>

      <Formik
        initialValues={ttsInitialValues}
        validationSchema={ttsSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, values }) => (
          <Form className="studio-form" noValidate>
            <div className="field-row">
              <label className="field" htmlFor="target_language_code">
                <span className="field-label">Language</span>
                <Field
                  as="select"
                  id="target_language_code"
                  name="target_language_code"
                  className="field-control"
                >
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Field>
              </label>

              <label className="field" htmlFor="speaker">
                <span className="field-label">Voice</span>
                <Field
                  as="select"
                  id="speaker"
                  name="speaker"
                  className="field-control"
                >
                  {SPEAKER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Field>
              </label>
            </div>

            <Field name="text">
              {({ field, meta }: FieldProps<string>) => (
                <div className="field field-block">
                  <div className="field-head">
                    <label className="field-label" htmlFor="text">
                      Script
                    </label>
                    <span className="field-meta" aria-live="polite">
                      {field.value.length}/2500
                    </span>
                  </div>
                  <textarea
                    {...field}
                    id="text"
                    rows={7}
                    maxLength={2500}
                    className="field-control field-textarea"
                    placeholder="Type or paste the lines you want spoken…"
                    aria-invalid={meta.touched && Boolean(meta.error)}
                    aria-describedby={
                      meta.touched && meta.error ? "text-error" : undefined
                    }
                  />
                  {meta.touched && meta.error ? (
                    <p id="text-error" className="field-error" role="alert">
                      {meta.error}
                    </p>
                  ) : null}
                </div>
              )}
            </Field>

            <div className="studio-actions">
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="btn-loading">
                    <span className="btn-pulse" aria-hidden />
                    Composing voice…
                  </span>
                ) : (
                  "Generate speech"
                )}
              </button>
              {audioUrl ? (
                <a
                  className="btn-ghost"
                  href={audioUrl}
                  download={`vani-${values.speaker}.wav`}
                >
                  Download WAV
                </a>
              ) : null}
            </div>

            {submitError ? (
              <p className="form-error" role="alert">
                {submitError}
              </p>
            ) : null}

            {audioUrl ? (
              <div className="player" key={audioUrl}>
                <p className="player-label">Ready to listen</p>
                <audio controls autoPlay src={audioUrl} className="player-audio">
                  Your browser does not support audio playback.
                </audio>
              </div>
            ) : null}
          </Form>
        )}
      </Formik>
    </div>
  );
}
