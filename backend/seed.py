from app.models.phoneme import create_phoneme
from app.models.exercise import create_exercise
from app.models.exercise_target import create_exercise_target


def seed_data():
    # English phonemes
    r_phoneme_id = create_phoneme({
        "symbol": "/r/",
        "name": "R sound",
        "language": "English",
        "description": "The English R sound.",
    })

    p_phoneme_id = create_phoneme({
        "symbol": "/p/",
        "name": "P sound",
        "language": "English",
        "description": "The English P sound.",
    })

    # Arabic phonemes
    ra_phoneme_id = create_phoneme({
        "symbol": "/ر/",
        "name": "ر",
        "language": "Arabic",
        "description": "The Arabic letter ر.",
    })

    ayn_phoneme_id = create_phoneme({
        "symbol": "/ع/",
        "name": "ع",
        "language": "Arabic",
        "description": "The Arabic letter ع.",
    })

    # English exercise
    rabbit_exercise_id = create_exercise({
        "title": "Practice the R Sound",
        "description": "Practice words containing the English R sound.",
        "language": "English",
        "difficulty_level": "Easy",
        "created_by": "system",
    })

    create_exercise_target({
        "exercise_id": rabbit_exercise_id,
        "phoneme_id": r_phoneme_id,
        "target_word": "rabbit",
    })

    # English exercise
    penguin_exercise_id = create_exercise({
        "title": "Practice the P Sound",
        "description": "Practice words containing the English P sound.",
        "language": "English",
        "difficulty_level": "Easy",
        "created_by": "system",
    })

    create_exercise_target({
        "exercise_id": penguin_exercise_id,
        "phoneme_id": p_phoneme_id,
        "target_word": "penguin",
    })

    # Arabic exercise
    arabic_r_exercise_id = create_exercise({
        "title": "تدريب على حرف الراء",
        "description": "تدريب على نطق حرف الراء.",
        "language": "Arabic",
        "difficulty_level": "Easy",
        "created_by": "system",
    })

    create_exercise_target({
        "exercise_id": arabic_r_exercise_id,
        "phoneme_id": ra_phoneme_id,
        "target_word": "رمان",
    })

    # Arabic exercise
    arabic_ayn_exercise_id = create_exercise({
        "title": "تدريب على حرف العين",
        "description": "تدريب على نطق حرف العين.",
        "language": "Arabic",
        "difficulty_level": "Easy",
        "created_by": "system",
    })

    create_exercise_target({
        "exercise_id": arabic_ayn_exercise_id,
        "phoneme_id": ayn_phoneme_id,
        "target_word": "عين",
    })

    print("SAWT seed data created successfully.")


if __name__ == "__main__":
    seed_data()