from datetime import datetime, timezone

from bson import ObjectId
from pymongo import ASCENDING

from app.db.database import db


ai_analyses_collection = db["ai_analyses"]


ai_analyses_collection.create_index(
    [
        ("attempt_id", ASCENDING),
    ]
)


def create_ai_analysis(analysis_data: dict):
    now = datetime.now(timezone.utc)

    analysis_data["created_at"] = now

    result = ai_analyses_collection.insert_one(
        analysis_data
    )

    return str(result.inserted_id)


def get_ai_analysis_by_attempt_id(attempt_id: str):
    return list(
        ai_analyses_collection.find(
            {
                "attempt_id": attempt_id
            }
        )
    )


def get_ai_analysis_by_id(analysis_id: str):
    try:
        return ai_analyses_collection.find_one(
            {
                "_id": ObjectId(analysis_id)
            }
        )
    except Exception:
        return None