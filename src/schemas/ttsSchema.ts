import * as Yup from "yup";

export const ttsSchema = Yup.object({
  text: Yup.string()
    .trim()
    .required("Enter text to speak")
    .max(2500, "Max 2500 characters"),
  target_language_code: Yup.string().required("Select a language"),
  speaker: Yup.string().required("Select a voice"),
});

export type TtsFormValues = Yup.InferType<typeof ttsSchema>;
