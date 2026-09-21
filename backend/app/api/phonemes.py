from fastapi import APIRouter, Depends, HTTPException

from app.models.phoneme import (
    create_phoneme,
    get_phonemes,
    get_phoneme_by_id,
)
from app.schemas.phoneme import PhonemeCreate
from app.utils.roles import require_role


router = APIRouter(
    prefix="/phonemes",
    tags=["Phonemes"],
)


@router.post("/")
def create_phoneme_endpoint(
    phoneme: PhonemeCreate,
    current_user=Depends(require_role("parent", "therapist", "admin")),
):
    phoneme_data = {
        "symbol": phoneme.symbol,
        "name": phoneme.name,
        "language": phoneme.language,
        "description": phoneme.description,
    }

    try:
        phoneme_id = create_phoneme(phoneme_data)

        return {
            "message": "Phoneme created successfully",
            "phoneme_id": phoneme_id,
        }

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Phoneme already exists for this language",
        )


@router.get("/")
def list_phonemes(
    current_user=Depends(require_role("parent", "therapist", "admin")),
):
    phonemes = get_phonemes()

    return {
        "phonemes": [
            {
                "id": str(phoneme["_id"]),
                "symbol": phoneme["symbol"],
                "name": phoneme["name"],
                "language": phoneme["language"],
                "description": phoneme.get("description"),
            }
            for phoneme in phonemes
        ]
    }


@router.get("/{phoneme_id}")
def get_phoneme(
    phoneme_id: str,
    current_user=Depends(require_role("parent", "therapist", "admin")),
):
    phoneme = get_phoneme_by_id(phoneme_id)

    if not phoneme:
        raise HTTPException(
            status_code=404,
            detail="Phoneme not found",
        )

    return {
        "id": str(phoneme["_id"]),
        "symbol": phoneme["symbol"],
        "name": phoneme["name"],
        "language": phoneme["language"],
        "description": phoneme.get("description"),
    }