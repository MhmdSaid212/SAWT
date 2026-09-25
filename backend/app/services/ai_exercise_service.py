from groq import Groq
from google import genai
import os
import json


def generate_exercise(
    language: str,
    phoneme: str,
    difficulty: str,
    word_count: int = 5,
):
    prompt = f"""
You are an assistant helping a speech therapist create
pronunciation practice exercises for children.

Generate one pronunciation exercise using:

Language: {language}
Target phoneme: {phoneme}
Difficulty: {difficulty}
Number of target words: {word_count}

Rules:
- Words must be appropriate for children.
- Every target word must contain the requested phoneme.
- Use the requested language.
- Avoid medical claims or diagnosis.
- Keep words practical and easy to pronounce.
- Return ONLY valid JSON.
- Do not include markdown.

Return exactly this structure:

{{
  "title": "short exercise title",
  "instructions": "short child-friendly instructions",
  "words": [
    "word1",
    "word2",
    "word3"
  ]
}}
"""

    # -------------------------
    # Groq
    # -------------------------

    groq_key = os.getenv("GROQ_API_KEY")

    if groq_key:
        try:
            client = Groq(api_key=groq_key)

            response = client.chat.completions.create(
                model="openai/gpt-oss-120b",
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
            )

            content = response.choices[0].message.content

            if content:
                print("SAWT Exercise Generator: Groq")

                return json.loads(
                    content.strip()
                )

        except Exception as error:
            print(
                f"SAWT Groq Exercise Error: {error}"
            )

    # -------------------------
    # Gemini fallback
    # -------------------------

    gemini_key = os.getenv("GEMINI_API_KEY")

    if gemini_key:
        try:
            client = genai.Client(
                api_key=gemini_key
            )

            response = client.models.generate_content(
                model="gemini-3.8-flash",
                contents=prompt,
            )

            if response.text:
                print(
                    "SAWT Exercise Generator: Gemini"
                )

                return json.loads(
                    response.text.strip()
                )

        except Exception as error:
            print(
                f"SAWT Gemini Exercise Error: {error}"
            )

    raise RuntimeError(
        "AI exercise generation is currently unavailable."
    )