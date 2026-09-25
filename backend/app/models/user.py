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



def update_user(user_id: str, update_data: dict):
    try:
        update_data["updated_at"] = datetime.now(timezone.utc)

        result = users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data},
        )

        return result.modified_count > 0

    except Exception:
        return False




def delete_user(user_id: str):
    try:
        result = users_collection.delete_one(
            {"_id": ObjectId(user_id)}
        )

        return result.deleted_count > 0

    except Exception:
        return False



def get_users():
    return list(
        users_collection.find(
            {
                "role": {
                    "$in": ["parent", "child", "admin"]
                }
            },
            {
                "password_hash": 0,
            },
        )
    )