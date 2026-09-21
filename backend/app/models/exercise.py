from datetime import datetime, timezone

from bson import ObjectId
from pymongo import ASCENDING

from app.db.database import db


exercises_collection = db["exercises"]

exercises_collection.create_index(
    [("language", ASCENDING)],
)


def create_exercise(exercise_data: dict):
    exercise_data["created_at"] = datetime.now(timezone.utc)
    exercise_data["updated_at"] = datetime.now(timezone.utc)

    result = exercises_collection.insert_one(exercise_data)

    return str(result.inserted_id)


def get_exercises():
    return list(
        exercises_collection.find()
    )


def get_exercise_by_id(exercise_id: str):
    try:
        return exercises_collection.find_one(
            {"_id": ObjectId(exercise_id)}
        )
    except Exception:
        return None