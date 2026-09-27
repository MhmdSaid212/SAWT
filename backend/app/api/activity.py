from fastapi import APIRouter, Depends, HTTPException, status

from app.utils.auth import get_current_user
from app.models.child import get_children_by_parent_id, get_child_by_id
from app.models.assignment import get_assignments_by_child_id
from app.api.assignments import get_effective_assignment_status
from app.models.exercise import get_exercise_by_id
from app.models.therapist import get_therapist_by_id
from app.models.user import get_user_by_id
from app.models.attempt import get_attempts_by_child_id


router = APIRouter(
    prefix="/activity",
    tags=["Activity"],
)


@router.get("/parent")
def get_parent_activity(
    current_user=Depends(get_current_user),
):
    if current_user["role"] != "parent":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only parents can access activity",
        )

    parent_id = str(current_user["id"])

    children = get_children_by_parent_id(parent_id)

    activities = []

    for child in children:
        child_id = str(child["_id"])
        child_name = child.get("full_name", "Unknown child")

        # ---------------------------------------------------------
        # Exercise assignments
        # ---------------------------------------------------------

        assignments = get_assignments_by_child_id(child_id)

        for assignment in assignments:
            exercise = get_exercise_by_id(
                assignment.get("exercise_id")
            )

            therapist = get_therapist_by_id(
                assignment.get("assigned_by")
            )

            therapist_name = None

            if therapist:
                therapist_user = get_user_by_id(
                    therapist.get("user_id")
                )

                if therapist_user:
                    therapist_name = therapist_user.get("name")

            activities.append({
                "id": str(assignment["_id"]),
                "type": "exercise_assigned",
                "child_id": child_id,
                "child_name": child_name,
                "exercise_id": assignment.get("exercise_id"),
                "exercise_title": (
                    exercise.get("title")
                    if exercise
                    else "Practice exercise"
                ),
                "target_word": (
                    exercise.get("target_word")
                    if exercise
                    else None
                ),
                "therapist_name": therapist_name,
                "assigned_at": assignment.get("assigned_at"),
                "due_date": assignment.get("due_date"),
                "status": get_effective_assignment_status(
                    assignment
                ),
            })

        # ---------------------------------------------------------
        # Therapist feedback
        # ---------------------------------------------------------

        attempts = get_attempts_by_child_id(child_id)

        for attempt in attempts:
            therapist_feedback = attempt.get(
                "therapist_feedback"
            )

            if not therapist_feedback:
                continue

            exercise = get_exercise_by_id(
                attempt.get("exercise_id")
            )

            activities.append({
                "id": f"feedback-{str(attempt['_id'])}",
                "type": "therapist_feedback",
                "child_id": child_id,
                "child_name": child_name,
                "exercise_id": attempt.get("exercise_id"),
                "exercise_title": (
                    exercise.get("title")
                    if exercise
                    else "Practice exercise"
                ),
                "target_word": (
                    exercise.get("target_word")
                    if exercise
                    else None
                ),
                "therapist_feedback": therapist_feedback,
                "created_at": attempt.get(
                    "therapist_feedback_updated_at"
                ) or attempt.get("created_at"),
                "attempt_id": str(attempt["_id"]),
            })

    # -------------------------------------------------------------
    # Sort newest activity first
    # -------------------------------------------------------------

    activities.sort(
        key=lambda activity: (
            activity.get("created_at")
            or activity.get("assigned_at")
            or ""
        ),
        reverse=True,
    )

    return {
        "activities": activities,
        "total": len(activities),
    }


