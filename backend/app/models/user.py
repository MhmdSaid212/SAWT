from datetime import datetime, timezone

from bson import ObjectId
from pymongo import ASCENDING

from app.db.database import db


users_collection = db["users"]

users_collection.create_index(
    [("email", ASCENDING)],
    unique=True,
)


def create_user(user_data: dict):
    user_data["created_at"] = datetime.now(timezone.utc)
    user_data["updated_at"] = datetime.now(timezone.utc)

    result = users_collection.insert_one(user_data)

    return str(result.inserted_id)


def get_user_by_email(email: str):
    return users_collection.find_one({"email": email})


def get_user_by_id(user_id: str):
    try:
        return users_collection.find_one({"_id": ObjectId(user_id)})
    except Exception:
        return None