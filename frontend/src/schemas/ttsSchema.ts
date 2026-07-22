import * as Yup from "yup";

export interface TtsFormValues {
  text: string;
  target_language_code: string;
  speaker: string;
}

export const ttsInitialValues: TtsFormValues = {
  text: "मेरे शहर में बहुत सी बारिश आती है।",
  target_language_code: "hi-IN",
  speaker: "shubh",
};

export const ttsSchema = Yup.object({
  text: Yup.string()
    .trim()
    .required("Enter some text to speak")
    .min(1, "Enter some text to speak")
    .max(2500, "Keep text under 2500 characters"),
  target_language_code: Yup.string().required("Choose a language"),
  speaker: Yup.string().required("Choose a voice"),
});
