from pathlib import Path

from openpronounce import load_audio
from openpronounce import phones


def analyze_pronunciation(audio_path: str, expected_text: str) -> dict:
    """
    Analyze pronunciation using OpenPronounce's phoneme recognition
    and alignment logic.
    """

    audio_file = Path(audio_path)

    if not audio_file.exists():
        raise FileNotFoundError(
            f"Audio file not found: {audio_path}"
        )

    # Load audio and let OpenPronounce handle normalization.
    sound = load_audio(str(audio_file))

    # Recognize the phonemes actually spoken.
    recognition = phones.recognize_phones(
        sound,
        16000,
        lang="en",
    )

    # OpenPronounce's own phoneme comparison/alignment.
    phone_result = phones.compare_phones(
        recognition,
        expected_text,
        lang="en",
    )

    expected_phones = [
        phoneme
        for group in phone_result["expected_phones"]
        for phoneme in group
    ]

    heard_phones = list(
        phone_result["heard_phones"]
    )

    recognition_confidences = [
        round(float(confidence), 3)
        for confidence in recognition.confidences
    ]

    # Detect phoneme differences directly.
    # We intentionally do not rely on OpenPronounce's
    # threshold-filtered `errors` list.

    mismatches = []

    max_length = max(
        len(expected_phones),
        len(heard_phones),
    )

    for index in range(max_length):
        expected = (
            expected_phones[index]
            if index < len(expected_phones)
            else None
        )

        heard = (
            heard_phones[index]
            if index < len(heard_phones)
            else None
        )

        if expected != heard:
            recognition_confidence = (
                recognition_confidences[index]
                if index < len(recognition_confidences)
                else 0.0
            )

            mismatches.append(
                {
                    "position": index,
                    "expected": expected,
                    "heard": heard,
                    "recognition_confidence": recognition_confidence,
                }
            )

    return {
        "expected_text": expected_text,
        "expected_phones": expected_phones,
        "heard_phones": heard_phones,
        "recognition_confidences": recognition_confidences,
        "phoneme_error_rate": round(
            float(phone_result["phone_error_rate"]),
            4,
        ),
        "mismatches": mismatches,
    }