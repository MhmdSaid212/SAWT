from fastapi import APIRouter, Depends, HTTPException, status

from app.models.exercise import (
    create_exercise,
    get_exercises,
    get_exercise_by_id,
    update_exercise,
    delete_exercise,
)

from app.models.exercise_target import (
    create_exercise_target,
    get_targets_by_exercise_id,
    delete_targets_by_exercise_id,
)

from app.models.phoneme import get_phoneme_by_id

from app.schemas.exercise import (
    ExerciseCreate,
    ExerciseUpdate,
)

from app.utils.auth import get_current_user
from app.utils.roles import require_role


router = APIRouter(
    prefix="/exercises",
    tags=["Exercises"],
)


def format_exercise(exercise):
    targets = get_targets_by_exercise_id(
        str(exercise["_id"])
    )

    formatted_targets = []

    for target in targets:
        phoneme = get_phoneme_by_id(
            target["phoneme_id"]
        )

        formatted_targets.append(
            {
                "id": str(target["_id"]),
                "phoneme_id": target["phoneme_id"],
                "target_word": target["target_word"],
                "phoneme_symbol": (
                    phoneme["symbol"]
                    if phoneme
                    else None
                ),
            }
        )

    return {
        "id": str(exercise["_id"]),
        "title": exercise["title"],
        "description": exercise.get("description"),
        "language": exercise["language"],
        "difficulty_level": exercise[
            "difficulty_level"
        ],
        "created_by": exercise["created_by"],
        "targets": formatted_targets,
    }


@router.post("/")
def create_exercise_endpoint(
    exercise: ExerciseCreate,
    current_user=Depends(
        require_role("therapist", "admin")
    ),
):
    exercise_data = {
        "title": exercise.title,
        "description": exercise.description,
        "language": exercise.language,
        "difficulty_level": exercise.difficulty_level,
        "created_by": current_user["id"],
    }

    exercise_id = create_exercise(
        exercise_data
    )

    for target in exercise.targets:
        create_exercise_target(
            {
                "exercise_id": exercise_id,
                "phoneme_id": target.phoneme_id,
                "target_word": target.target_word,
            }
        )

    return {
        "message": "Exercise created successfully",
        "exercise_id": exercise_id,
    }


@router.get("/")
def list_exercises(
    current_user=Depends(
    require_role(
        "parent",
        "child",
        "therapist",
        "admin",
    )
),
):
    exercises = get_exercises()

    return {
        "exercises": [
            format_exercise(exercise)
            for exercise in exercises
        ]
    }


@router.get("/{exercise_id}")
def get_exercise_details(
    exercise_id: str,
    current_user=Depends(
    require_role(
        "parent",
        "child",
        "therapist",
        "admin",
    )
),
):
    exercise = get_exercise_by_id(
        exercise_id
    )

    if not exercise:
        raise HTTPException(
            status_code=404,
            detail="Exercise not found",
        )

    return format_exercise(exercise)


@router.patch("/{exercise_id}")
def update_exercise_endpoint(
    exercise_id: str,
    exercise: ExerciseUpdate,
    current_user=Depends(get_current_user),
):
    if current_user["role"] not in {
        "therapist",
        "admin",
    }:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only therapists and admins can update exercises",
        )

    existing_exercise = get_exercise_by_id(
        exercise_id
    )

    if not existing_exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found",
        )

    update_data = {
        "title": exercise.title,
        "description": exercise.description,
        "language": exercise.language,
        "difficulty_level": exercise.difficulty_level,
    }

    updated = update_exercise(
        exercise_id,
        update_data,
    )

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Exercise was not updated",
        )

    delete_targets_by_exercise_id(
        exercise_id
    )

    for target in exercise.targets:
        create_exercise_target(
            {
                "exercise_id": exercise_id,
                "phoneme_id": target.phoneme_id,
                "target_word": target.target_word,
            }
        )

    return {
        "message": "Exercise updated successfully",
        "exercise_id": exercise_id,
    }


@router.delete("/{exercise_id}")
def delete_exercise_endpoint(
    exercise_id: str,
    current_user=Depends(get_current_user),
):
    if current_user["role"] not in {
        "therapist",
        "admin",
    }:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only therapists and admins can delete exercises",
        )

    existing_exercise = get_exercise_by_id(
        exercise_id
    )

    if not existing_exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found",
        )

    delete_targets_by_exercise_id(
        exercise_id
    )

    deleted = delete_exercise(
        exercise_id
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Exercise was not deleted",
        )

    return {
        "message": "Exercise deleted successfully",
        "exercise_id": exercise_id,
    }