from datetime import datetime, timezone

from bson import ObjectId
from pymongo import ASCENDING

from app.db.database import db


exercises_collection = db["exercises"]


exercises_collection.create_index(
    [
        ("language", ASCENDING),
        ("title", ASCENDING),
    ]
)


def create_exercise(exercise_data: dict):
    now = datetime.now(timezone.utc)

    exercise_data["created_at"] = now
    exercise_data["updated_at"] = now

    result = exercises_collection.insert_one(exercise_data)

    return str(result.inserted_id)


def get_exercises():
    return list(
        exercises_collection.find()
    )


def get_exercise_by_id(exercise_id: str):
    try:
        return exercises_collection.find_one(
            {
                "_id": ObjectId(exercise_id)
            }
        )
    except Exception:
        return None


def update_exercise(
    exercise_id: str,
    update_data: dict,
):
    try:
        result = exercises_collection.update_one(
            {
                "_id": ObjectId(exercise_id)
            },
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


def delete_exercise(exercise_id: str):
    try:
        result = exercises_collection.delete_one(
            {
                "_id": ObjectId(exercise_id)
            }
        )

        return result.deleted_count > 0

    except Exception:
        return False