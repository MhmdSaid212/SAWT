from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.utils.auth import get_current_user
from app.services.ai_exercise_service import generate_exercise


router = APIRouter(
    prefix="/ai-exercises",
    tags=["AI Exercises"],
)


class GenerateExerciseRequest(BaseModel):
    language: str
    phoneme: str
    difficulty: str
    word_count: int = 5


@router.post("/generate")
def generate_exercise_endpoint(
    request: GenerateExerciseRequest,
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "therapist":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only therapists can generate exercises",
        )

    if request.word_count < 3 or request.word_count > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Word count must be between 3 and 10",
        )

    try:
        exercise = generate_exercise(
            language=request.language,
            phoneme=request.phoneme,
            difficulty=request.difficulty,
            word_count=request.word_count,
        )

        return {
            "success": True,
            "exercise": exercise,
        }

    except Exception as error:
        print(
            f"AI exercise generation endpoint error: {error}"
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to generate exercise",
        )