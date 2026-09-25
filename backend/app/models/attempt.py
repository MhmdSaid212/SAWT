from datetime import datetime, timezone

from bson import ObjectId
from pymongo import ASCENDING

from app.db.database import db


attempts_collection = db["attempts"]


attempts_collection.create_index(
    [
        ("child_id", ASCENDING),
        ("exercise_id", ASCENDING),
    ]
)


def create_attempt(attempt_data: dict):
    now = datetime.now(timezone.utc)

    attempt_data["created_at"] = now
    attempt_data["updated_at"] = now

    result = attempts_collection.insert_one(attempt_data)

    return str(result.inserted_id)


def get_attempt_by_id(attempt_id: str):
    try:
        return attempts_collection.find_one(
            {
                "_id": ObjectId(attempt_id)
            }
        )
    except Exception:
        return None


def get_attempts_by_child_id(child_id: str):
    return list(
        attempts_collection.find(
            {
                "child_id": child_id
            }
        )
    )




def get_attempts_by_child_ids(child_ids: list[str]):
    return list(
        attempts_collection.find({
            "child_id": {
                "$in": child_ids
            }
        })
    )




def update_attempt(attempt_id: str, update_data: dict):
    try:
        result = attempts_collection.update_one(
            {"_id": ObjectId(attempt_id)},
            {
                "$set": {
                    **update_data,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )
        return result.modified_count > 0
    except Exception:
        return False