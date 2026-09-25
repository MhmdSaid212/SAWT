from datetime import datetime, timezone
from pymongo import ASCENDING
from app.db.database import db


assignments_collection = db["assignments"]

assignments_collection.create_index([
    ("child_id", ASCENDING),
    ("exercise_id", ASCENDING),
])


def create_assignment(assignment_data: dict):
    now = datetime.now(timezone.utc)

    if "due_date" in assignment_data and assignment_data["due_date"]:
        assignment_data["due_date"] = datetime.combine(
            assignment_data["due_date"],
            datetime.min.time(),
            tzinfo=timezone.utc,
        )

    # Assignment lifecycle
    assignment_data["status"] = "assigned"
    assignment_data["best_score"] = 0.0
    assignment_data["attempt_count"] = 0
    assignment_data["completed_at"] = None

    assignment_data["assigned_at"] = now
    assignment_data["created_at"] = now
    assignment_data["updated_at"] = now

    result = assignments_collection.insert_one(assignment_data)

    return str(result.inserted_id)


def get_assignments_by_child_id(child_id: str):
    return list(
        assignments_collection.find({
            "child_id": child_id
        })
    )


def get_assignment_by_id(assignment_id: str):
    from bson import ObjectId

    try:
        return assignments_collection.find_one({
            "_id": ObjectId(assignment_id)
        })
    except Exception:
        return None


def get_assignments_by_therapist_id(therapist_id: str):
    return list(
        assignments_collection.find({
            "assigned_by": therapist_id
        })
    )


def update_assignment(
    assignment_id: str,
    update_data: dict,
):
    from bson import ObjectId

    try:
        if "due_date" in update_data and update_data["due_date"]:
            update_data["due_date"] = datetime.combine(
                update_data["due_date"],
                datetime.min.time(),
                tzinfo=timezone.utc,
            )

        result = assignments_collection.update_one(
            {"_id": ObjectId(assignment_id)},
            {
                "$set": {
                    **update_data,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )

        return result.matched_count > 0

    except Exception:
        return False


def update_assignment_progress(
    assignment_id: str,
    score: float,
):
    """
    Update assignment progress after a pronunciation attempt.

    Rules:
    - Every attempt increments attempt_count.
    - best_score keeps the highest score.
    - score >= 80 => completed.
    - Once completed, later attempts do not revert it.
    """

    from bson import ObjectId

    try:
        assignment = assignments_collection.find_one({
            "_id": ObjectId(assignment_id)
        })

        if not assignment:
            return False

        current_best = float(assignment.get("best_score", 0.0))
        current_attempts = int(assignment.get("attempt_count", 0))

        new_best = max(current_best, float(score))
        new_attempt_count = current_attempts + 1

        update = {
            "best_score": new_best,
            "attempt_count": new_attempt_count,
            "updated_at": datetime.now(timezone.utc),
        }

        # Once completed, never revert to in_progress.
        if (
            float(score) >= 80
            or current_best >= 80
            or assignment.get("status") == "completed"
        ):
            update["status"] = "completed"

            if assignment.get("completed_at") is None:
                update["completed_at"] = datetime.now(timezone.utc)

        elif new_attempt_count == 1:
            update["status"] = "in_progress"

        else:
            update["status"] = "in_progress"

        result = assignments_collection.update_one(
            {"_id": ObjectId(assignment_id)},
            {"$set": update},
        )

        return result.matched_count > 0

    except Exception:
        return False


def mark_assignment_deassigned(assignment_id: str):
    from bson import ObjectId

    try:
        result = assignments_collection.update_one(
            {"_id": ObjectId(assignment_id)},
            {
                "$set": {
                    "status": "deassigned",
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )

        return result.matched_count > 0

    except Exception:
        return False


def delete_assignment(assignment_id: str):
    from bson import ObjectId

    try:
        result = assignments_collection.delete_one(
            {"_id": ObjectId(assignment_id)}
        )

        return result.deleted_count > 0

    except Exception:
        return False