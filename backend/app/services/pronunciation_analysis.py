from difflib import SequenceMatcher


def normalize_phonemes(phonemes: str) -> str:
    """
    Normalize phoneme strings while preserving phonetic symbols.
    """
    return "".join(phonemes.lower().split())


def compare_pronunciation(
    expected_phonemes: str,
    heard_phonemes: str,
) -> dict:
    expected = normalize_phonemes(expected_phonemes)
    heard = normalize_phonemes(heard_phonemes)

    matcher = SequenceMatcher(
        None,
        expected,
        heard,
    )

    similarity = matcher.ratio()
    score = round(similarity * 100, 2)

    return {
        "expected_phonemes": expected,
        "heard_phonemes": heard,
        "pronunciation_score": score,
        "is_correct": score >= 85,
    }