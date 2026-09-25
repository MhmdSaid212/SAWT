from groq import Groq
from google import genai
import os


def generate_ai_feedback(
    expected_word: str,
    transcript: str,
    pronunciation_score: float,
    analysis_details: str,
) -> str:
    prompt = f"""
You are SAWT, a friendly pronunciation practice assistant for children.

The child was practicing the word: "{expected_word}"
Speech transcription: "{transcript}"
Pronunciation score: {pronunciation_score}
Pronunciation analysis: {analysis_details}

Give very short, encouraging feedback suitable for a child.

Rules:
- Do not diagnose any medical condition.
- Do not mention AI, models, APIs, or technical details.
- If pronunciation was good, praise the child.
- If there was a pronunciation error, gently explain that they should try the word again.
- Keep the response to 1-2 short sentences.
- Never shame or discourage the child.
"""

    # 1. Groq — primary
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
                print("SAWT AI Feedback Provider: Groq")
                return content.strip()

        except Exception as error:
            print(f"SAWT Groq Error: {error}")

    # 2. Gemini — fallback
    gemini_key = os.getenv("GEMINI_API_KEY")

    if gemini_key:
        try:
            client = genai.Client(api_key=gemini_key)

            response = client.models.generate_content(
                model="gemini-3.8-flash",
                contents=prompt,
            )

            if response.text:
                print("SAWT AI Feedback Provider: Gemini")
                return response.text.strip()

        except Exception as error:
            print(f"SAWT Gemini Error: {error}")

    # 3. Local fallback
    if pronunciation_score >= 90:
        return "Great job! Your pronunciation sounds good. Keep practicing!"

    if pronunciation_score >= 70:
        return "Nice try! You're getting close. Try the word one more time!"

    if pronunciation_score >= 50:
        return "Not bad! Try the word one more time."

    return "Good effort! Let's try the word again together."


