"""Sarvam Bulbul v3 text-to-speech API."""

import base64
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sarvamai import SarvamAI

load_dotenv()

API_KEY = os.getenv("SARVAM_API_KEY")
if not API_KEY:
    raise SystemExit("Set SARVAM_API_KEY in .env")

client = SarvamAI(api_subscription_key=API_KEY)
app = FastAPI(title="Sarvam TTS")

# Comma-separated, e.g. http://localhost:3000,https://your-app.vercel.app
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["*"],
)


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2500)
    target_language_code: str = "hi-IN"
    speaker: str = "shubh"


@app.post("/tts")
def text_to_speech(body: TTSRequest):
    try:
        response = client.text_to_speech.convert(
            text=body.text,
            target_language_code=body.target_language_code,
            model="bulbul:v3",
            speaker=body.speaker,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    audio_b64 = response.audios[0]
    audio_bytes = base64.b64decode(audio_b64)
    return Response(content=audio_bytes, media_type="audio/wav")
