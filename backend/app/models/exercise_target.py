from datetime import datetime, timezone

from bson import ObjectId
from pymongo import ASCENDING

from app.db.database import db


exercise_targets_collection = db["exercise_targets"]

exercise_targets_collection.create_index(
    [("exercise_id", ASCENDING), ("phoneme_id", ASCENDING), ("target_word", ASCENDING)],
)


def create_exercise_target(target_data: dict):
    target_data["created_at"] = datetime.now(timezone.utc)

    result = exercise_targets_collection.insert_one(target_data)

    return str(result.inserted_id)


def get_targets_by_exercise_id(exercise_id: str):
    return list(
        exercise_targets_collection.find(
            {"exercise_id": exercise_id}
        )
    )


def get_exercise_target_by_id(target_id: str):
    try:
        return exercise_targets_collection.find_one(
            {"_id": ObjectId(target_id)}
        )
    except Exception:
        return None