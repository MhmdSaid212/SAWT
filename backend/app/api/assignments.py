from fastapi import APIRouter, Depends, HTTPException, status

from app.models.assignment import create_assignment, get_assignments_by_child_id, get_assignment_by_id, get_assignments_by_therapist_id, update_assignment, delete_assignment
from app.schemas.assignment import AssignmentCreate, AssignmentUpdate
from app.utils.auth import get_current_user, require_role
from app.models.child import get_child_by_id, get_all_children, get_children_by_therapist_id
from app.models.exercise import get_exercise_by_id
from app.models.attempt import get_attempts_by_child_ids, get_attempts_by_child_id
from app.models.therapist import get_therapist_by_user_id
from datetime import datetime, timezone


def get_effective_assignment_status(assignment: dict) -> str:
    """
    Calculate the assignment's current status.

    Rules:
    - completed stays completed
    - deassigned stays deassigned
    - unfinished assignment becomes overdue only AFTER its due date
    - unfinished assignment with attempts stays in_progress
    - otherwise assigned
    """

    stored_status = assignment.get("status", "assigned")

    # These statuses must never be overridden by the due date.
    if stored_status in ["completed", "deassigned"]:
        return stored_status

    due_date = assignment.get("due_date")

    if due_date:
        today = datetime.now(timezone.utc).date()

        # due_date is stored as a datetime at midnight.
        # Compare calendar dates so the assignment remains active
        # throughout its actual due date.
        if due_date.date() < today:
            return "overdue"

    if stored_status == "in_progress":
        return "in_progress"

    return "assigned"

router = APIRouter(
    prefix="/assignments",
    tags=["Assignments"],
)


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_new_assignment(
    assignment: AssignmentCreate,
    current_user=Depends(get_current_user),
):
    if current_user["role"] != "therapist":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only therapists can create assignments",
        )

    child = get_child_by_id(assignment.child_id)

    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found",
        )

    exercise = get_exercise_by_id(assignment.exercise_id)

    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found",
        )

    assignment_data = assignment.model_dump()

    assignment_data["assigned_by"] = str(current_user["id"])

    assignment_id = create_assignment(assignment_data)

    return {
        "message": "Assignment created successfully",
        "assignment_id": assignment_id,
    }



@router.get("/child/{child_id}")
def list_child_assignments(
    child_id: str,
    current_user=Depends(get_current_user),
):
    if current_user["role"] not in ["parent", "therapist", "child"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized",
        )

    assignments = get_assignments_by_child_id(child_id)
    attempts = get_attempts_by_child_id(child_id)

    return {
        "assignments": [
            {
                "id": str(assignment["_id"]),
                "child_id": assignment["child_id"],
                "exercise_id": assignment["exercise_id"],
                "assigned_by": assignment["assigned_by"],
                "assigned_at": assignment["assigned_at"],
                "due_date": assignment["due_date"],
                "status": get_effective_assignment_status(assignment),
                "best_score": assignment.get("best_score", 0.0),
                "attempt_count": assignment.get("attempt_count", 0),
                "completed_at": assignment.get("completed_at"),
            }
            for assignment in assignments
        ],
        "attempts_count": len(attempts),
    }



@router.get("/therapist/children")
def get_therapist_children(
    current_user=Depends(require_role("therapist")),
):
    therapist = get_therapist_by_user_id(
        str(current_user["id"])
    )

    if not therapist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Therapist profile not found",
        )

    children = get_children_by_therapist_id(
        str(therapist["_id"])
    )

    return {
        "children": [
            {
                "id": str(child["_id"]),
                "user_id": child["user_id"],
                "full_name": child["full_name"],
                "date_of_birth": child["date_of_birth"],
                "language_preference": child["language_preference"],
                "avatar_url": child.get("avatar_url"),
                "therapist_id": child.get("therapist_id"),
            }
            for child in children
        ]
    }

@router.get("/therapist/progress")
def get_therapist_progress(
    current_user=Depends(get_current_user),
):
    if current_user["role"] != "therapist":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only therapists can access progress",
        )

    therapist_user_id = str(current_user["id"])

    therapist = get_therapist_by_user_id(
    therapist_user_id
)

    if not therapist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Therapist profile not found",
        )

    children = get_children_by_therapist_id(
        str(therapist["_id"])
    )

    child_ids = [
        str(child["_id"])
        for child in children
    ]

    attempts = get_attempts_by_child_ids(child_ids)

    # ---------------------------------------------------------
    # Overall statistics
    # ---------------------------------------------------------

    scored_attempts = [
        attempt
        for attempt in attempts
        if attempt.get("ai_score") is not None
    ]

    scores = [
        float(attempt["ai_score"])
        for attempt in scored_attempts
    ]

    average_score = (
        round(sum(scores) / len(scores), 1)
        if scores
        else 0
    )

    # ---------------------------------------------------------
    # Per-child progress
    # ---------------------------------------------------------

    children_progress = []

    for child_id in child_ids:
        child = get_child_by_id(child_id)

        if not child:
            continue

        child_attempts = [
            attempt
            for attempt in attempts
            if attempt.get("child_id") == child_id
        ]

        child_scores = [
            float(attempt["ai_score"])
            for attempt in child_attempts
            if attempt.get("ai_score") is not None
        ]

        child_average = (
            round(sum(child_scores) / len(child_scores), 1)
            if child_scores
            else 0
        )

        latest_attempt = None

        if child_attempts:
            child_attempts.sort(
                key=lambda attempt: attempt.get(
                    "created_at",
                    ""
                ),
                reverse=True,
            )

            latest = child_attempts[0]

            latest_attempt = {
                "id": str(latest["_id"]),
                "score": latest.get("ai_score"),
                "feedback": latest.get("ai_feedback"),
                "created_at": latest.get("created_at"),
            }

        children_progress.append({
            "id": str(child["_id"]),
            "full_name": child.get("full_name"),
            "language_preference": child.get(
                "language_preference"
            ),
            "avatar_url": child.get("avatar_url"),
            "attempts_count": len(child_attempts),
            "average_score": child_average,
            "latest_attempt": latest_attempt,
        })

    # ---------------------------------------------------------
    # Recent attempts
    # ---------------------------------------------------------

    attempts.sort(
        key=lambda attempt: attempt.get(
            "created_at",
            ""
        ),
        reverse=True,
    )

    recent_attempts = []

    for attempt in attempts[:10]:
        child = get_child_by_id(
            attempt.get("child_id")
        )

        recent_attempts.append({
            "id": str(attempt["_id"]),
            "child_id": attempt.get("child_id"),
            "child_name": (
                child.get("full_name")
                if child
                else "Unknown child"
            ),
            "exercise_id": attempt.get("exercise_id"),
            "score": attempt.get("ai_score"),
            "feedback": attempt.get("ai_feedback"),
            "therapist_feedback": attempt.get(
                "therapist_feedback"
            ),
            "created_at": attempt.get("created_at"),
        })

    # ---------------------------------------------------------
    # Response
    # ---------------------------------------------------------

    return {
        "children_count": len(child_ids),
        "attempts_count": len(attempts),
        "average_score": average_score,
        "children": children_progress,
        "recent_attempts": recent_attempts,
    }


@router.get("/{assignment_id}")
def get_assignment_details(
    assignment_id: str,
    current_user=Depends(get_current_user),
):
    assignment = get_assignment_by_id(assignment_id)

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )

    user_role = current_user["role"]
    user_id = str(current_user["_id"])

    # Therapist can access assignments they created
    if user_role == "therapist":
        if assignment["assigned_by"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access assignments you created",
            )

    # Child can access only their own assignments
    elif user_role == "child":
        if assignment["child_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access your own assignments",
            )

    # Parent authorization will be connected to the child-parent
    # relationship when we finalize the parent assignment flow.
    elif user_role != "parent":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized",
        )

    return {
        "id": str(assignment["_id"]),
        "child_id": assignment["child_id"],
        "exercise_id": assignment["exercise_id"],
        "assigned_by": assignment["assigned_by"],
        "assigned_at": assignment["assigned_at"],
        "due_date": assignment["due_date"],
        "status": get_effective_assignment_status(assignment),
        "best_score": assignment.get("best_score", 0.0),
        "attempt_count": assignment.get("attempt_count", 0),
        "completed_at": assignment.get("completed_at"),
        "created_at": assignment["created_at"],
        "updated_at": assignment["updated_at"],
    }




@router.patch("/{assignment_id}")
def update_assignment_endpoint(
    assignment_id: str,
    assignment: AssignmentUpdate,
    current_user=Depends(get_current_user),
):
    if current_user["role"] != "therapist":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only therapists can update assignments",
        )

    existing_assignment = get_assignment_by_id(assignment_id)

    if not existing_assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )

    if existing_assignment["assigned_by"] != str(current_user["id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own assignments",
        )

    update_data = {
        "exercise_id": assignment.exercise_id,
        "due_date": assignment.due_date,
    }

    updated = update_assignment(
        assignment_id,
        update_data,
    )

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assignment was not updated",
        )

    return {
        "message": "Assignment updated successfully",
        "assignment_id": assignment_id,
    }



@router.delete("/{assignment_id}")
def delete_assignment_endpoint(
    assignment_id: str,
    current_user=Depends(get_current_user),
):
    if current_user["role"] != "therapist":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only therapists can deassign exercises",
        )

    existing_assignment = get_assignment_by_id(assignment_id)

    if not existing_assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )

    if existing_assignment["assigned_by"] != str(current_user["id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only deassign your own assignments",
        )

    deleted = delete_assignment(assignment_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assignment was not deleted",
        )

    return {
        "message": "Assignment deassigned successfully",
        "assignment_id": assignment_id,
    }