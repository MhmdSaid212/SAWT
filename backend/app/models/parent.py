from datetime import datetime, timezone

from bson import ObjectId
from pymongo import ASCENDING

from app.db.database import db


parents_collection = db["parents"]


parents_collection.create_index(
    [("user_id", ASCENDING)],
    unique=True,
)


def create_parent(parent_data: dict):
    parent_data["created_at"] = datetime.now(timezone.utc)
    parent_data["updated_at"] = datetime.now(timezone.utc)

    result = parents_collection.insert_one(parent_data)

    return str(result.inserted_id)


def get_parent_by_user_id(user_id: str):
    return parents_collection.find_one(
        {"user_id": user_id}
    )



def get_parent_by_id(parent_id: str):
    try:
        return parents_collection.find_one(
            {"_id": ObjectId(parent_id)}
        )
    except Exception:
        return None



def delete_parent(parent_id: str):
    try:
        result = parents_collection.delete_one(
            {"_id": ObjectId(parent_id)}
        )

        return result.deleted_count > 0
    except Exception:
        return False