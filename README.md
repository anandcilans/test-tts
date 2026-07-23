# Vāṇī — Sarvam Bulbul v3 TTS

Indian-language text-to-speech demo. A FastAPI backend calls [Sarvam](https://www.sarvam.ai/) Bulbul v3; a Next.js UI (Vāṇī) lets you type text, pick a language/voice, and play or download WAV audio.

## Stack

| Layer    | Tech                                      |
| -------- | ----------------------------------------- |
| Backend  | Python, FastAPI, Sarvam SDK, Uvicorn      |
| Frontend | Next.js 16, React 19, Formik, Yup, Tailwind |

## Setup

### 1. Backend

```bash
python -m venv env
# Windows: env\Scripts\activate
# macOS/Linux: source env/bin/activate
pip install -r requirements.txt
```

Create a `.env` in the repo root:

```env
SARVAM_API_KEY=your_sarvam_api_key
CORS_ORIGINS=http://localhost:3000
```

`CORS_ORIGINS` is a comma-separated list of allowed frontend origins (default: `http://localhost:3000`).

Run the API:

```bash
uvicorn main:app --reload --port 8000
```

Or with Docker:

```bash
docker build -t vani-tts .
docker run --env-file .env -p 8000:8000 vani-tts
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

In `.env.local`, set the backend URL:

```env
NEXT_PUBLIC_TTS_URL=http://localhost:8000
```

Open [http://localhost:3000](http://localhost:3000).

If the backend is behind an ngrok tunnel, use that HTTPS URL instead (the UI already sends `ngrok-skip-browser-warning`).

## API

### `POST /tts`

Request body:

```json
{
  "text": "मेरे शहर में बहुत सी बारिश आती है।",
  "target_language_code": "hi-IN",
  "speaker": "shubh"
}
```

| Field                  | Required | Notes                          |
| ---------------------- | -------- | ------------------------------ |
| `text`                 | yes      | 1–2500 characters              |
| `target_language_code` | no       | default `hi-IN`                |
| `speaker`              | no       | default `shubh`                |

Response: raw `audio/wav` bytes.

Quick check with the sample payload:

```bash
curl -X POST http://localhost:8000/tts \
  -H "Content-Type: application/json" \
  -d @body.json \
  --output output.wav
```

## Project layout

```text
.
├── main.py            # FastAPI /tts endpoint
├── body.json          # Sample request
├── requirements.txt
├── Dockerfile
├── .env               # SARVAM_API_KEY, CORS_ORIGINS (not committed)
└── frontend/          # Next.js Vāṇī UI
```

## Notes

- Speakers and languages in the UI are a curated subset; the Sarvam API may support more.
- Keep `SARVAM_API_KEY` out of git; `.dockerignore` already excludes `.env`.
- Deploy frontend on Vercel + local Docker backend: see [`vercel-deploy.md`](vercel-deploy.md).
