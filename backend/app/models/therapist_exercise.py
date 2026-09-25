from datetime import datetime, timezone

from pymongo import ASCENDING

from app.db.database import db


therapist_exercises_collection = db["therapist_exercises"]

therapist_exercises_collection.create_index(
    [
        ("therapist_id", ASCENDING),
        ("exercise_id", ASCENDING),
    ],
    unique=True,
)


def create_therapist_exercise(data: dict):
    now = datetime.now(timezone.utc)

    data["created_at"] = now
    data["updated_at"] = now

    result = therapist_exercises_collection.insert_one(data)

    return str(result.inserted_id)


def get_therapist_exercises(therapist_id: str):
    return list(
        therapist_exercises_collection.find({
            "therapist_id": therapist_id
        })
    )


def get_therapist_exercise_by_id(therapist_exercise_id: str):
    from bson import ObjectId

    try:
        return therapist_exercises_collection.find_one({
            "_id": ObjectId(therapist_exercise_id)
        })
    except Exception:
        return None