from fastapi import APIRouter, Depends, HTTPException, status

from app.models.therapist_exercise import (
    create_therapist_exercise,
    get_therapist_exercises,
)
from app.schemas.therapist_exercise import TherapistExerciseCreate
from app.utils.auth import get_current_user


router = APIRouter(
    prefix="/therapist-exercises",
    tags=["Therapist Exercises"],
)


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_new_therapist_exercise(
    exercise: TherapistExerciseCreate,
    current_user=Depends(get_current_user),
):
    if current_user["role"] != "therapist":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only therapists can customize exercises",
        )

    data = exercise.model_dump()
    data["therapist_id"] = str(current_user["id"])

    exercise_id = create_therapist_exercise(data)

    return {
        "message": "Therapist exercise created successfully",
        "therapist_exercise_id": exercise_id,
    }


@router.get("/")
def list_my_therapist_exercises(
    current_user=Depends(get_current_user),
):
    if current_user["role"] != "therapist":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only therapists can access customized exercises",
        )

    exercises = get_therapist_exercises(
        str(current_user["id"])
    )

    return [
        {
            "id": str(exercise["_id"]),
            "therapist_id": exercise["therapist_id"],
            "exercise_id": exercise["exercise_id"],
            "customization_notes": exercise.get("customization_notes"),
            "created_at": exercise["created_at"],
            "updated_at": exercise["updated_at"],
        }
        for exercise in exercises
    ]