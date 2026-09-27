import os

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel


router = APIRouter(prefix="/ai", tags=["AI"])


class TTSRequest(BaseModel):
    text: str


@router.post("/tts")
async def generate_tts(payload: TTSRequest):
    text = payload.text.strip()

    if not text:
        raise HTTPException(
            status_code=400,
            detail="Text is required.",
        )

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured.",
        )

    body = {
        "model": "gemini-3.8-flash-lite-tts",
        "input": [
            {
                "type": "user_input",
                "content": [
                    {
                        "type": "text",
                        "text": text,
                        "annotations": [
                            {
                                "type": "speech_metadata",
                                "style": (
                                    "Speak this target word clearly, slowly, "
                                    "warmly, and cheerfully for a young child "
                                    "practicing pronunciation. "
                                    "Say only the target word."
                                ),
                            }
                        ],
                    }
                ],
            }
        ],
        "response_format": {
            "type": "audio"
        },
        "generation_config": {
            "speech_config": [
                {
                    "voice": "Kore"
                }
            ]
        },
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                "https://generativelanguage.googleapis.com/v1beta/interactions",
                headers={
                    "x-goog-api-key": api_key,
                    "Content-Type": "application/json",
                },
                json=body,
            )

    except httpx.RequestError:
        raise HTTPException(
            status_code=502,
            detail="Could not connect to Gemini TTS.",
        )

    if not response.is_success:
        raise HTTPException(
            status_code=502,
            detail="Gemini TTS request failed.",
        )

    data = response.json()

    audio_data = None

    for step in data.get("steps", []):
        for content in step.get("content", []):
            if (
                content.get("type") == "audio"
                and content.get("data")
            ):
                audio_data = content["data"]
                break

        if audio_data:
            break

    if not audio_data:
        raise HTTPException(
            status_code=502,
            detail="Gemini TTS returned no audio.",
        )

    return {
        "mime_type": "audio/wav",
        "audio_base64": audio_data,
    }