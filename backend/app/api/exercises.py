from fastapi import APIRouter, Depends, HTTPException
from app.models.exercise import create_exercise, get_exercises, get_exercise_by_id
from app.schemas.exercise import ExerciseCreate
from app.utils.roles import require_role


router = APIRouter(
    prefix="/exercises",
    tags=["Exercises"],
)


@router.post("/")
def create_exercise_endpoint(
    exercise: ExerciseCreate,
    current_user=Depends(require_role("therapist", "admin")),
):
    exercise_data = {
        "title": exercise.title,
        "description": exercise.description,
        "language": exercise.language,
        "difficulty_level": exercise.difficulty_level,
        "created_by": current_user["id"],
    }

    exercise_id = create_exercise(exercise_data)

    return {
        "message": "Exercise created successfully",
        "exercise_id": exercise_id,
    }




@router.get("/")
def list_exercises(
    current_user=Depends(require_role("parent", "therapist", "admin")),
):
    exercises = get_exercises()

    return {
        "exercises": [
            {
                "id": str(exercise["_id"]),
                "title": exercise["title"],
                "description": exercise.get("description"),
                "language": exercise["language"],
                "difficulty_level": exercise["difficulty_level"],
                "created_by": exercise["created_by"],
            }
            for exercise in exercises
        ]
    }



@router.get("/{exercise_id}")
def get_exercise_details(
    exercise_id: str,
    current_user=Depends(require_role("parent", "therapist", "admin")),
):
    exercise = get_exercise_by_id(exercise_id)

    if not exercise:
        raise HTTPException(
            status_code=404,
            detail="Exercise not found",
        )

    return {
        "id": str(exercise["_id"]),
        "title": exercise["title"],
        "description": exercise.get("description"),
        "language": exercise["language"],
        "difficulty_level": exercise["difficulty_level"],
        "created_by": exercise["created_by"],
    }