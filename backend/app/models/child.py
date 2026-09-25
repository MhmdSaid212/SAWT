from datetime import datetime, timezone

from bson import ObjectId
from pymongo import ASCENDING

from app.db.database import db


children_collection = db["children"]


children_collection.create_index(
    [("user_id", ASCENDING)],
)


def create_child(child_data: dict):
    child_data["therapist_id"] = child_data.get("therapist_id")
    child_data["created_at"] = datetime.now(timezone.utc)
    child_data["updated_at"] = datetime.now(timezone.utc)

    result = children_collection.insert_one(child_data)

    return str(result.inserted_id)

def get_children_by_parent_id(parent_id: str):
    return list(
        children_collection.find(
            {"parent_id": parent_id}
        )
    )


def get_child_by_id(child_id: str):
    try:
        return children_collection.find_one(
            {"_id": ObjectId(child_id)}
        )
    except Exception:
        return None



def get_child_by_user_id(user_id: str):
    return children_collection.find_one(
        {"user_id": user_id}
    )



def delete_child(child_id: str):
    try:
        result = children_collection.delete_one(
            {"_id": ObjectId(child_id)}
        )

        return result.deleted_count > 0

    except Exception:
        return False


def get_all_children():
    return list(
        children_collection.find({})
    )



def get_children_by_therapist_id(therapist_id: str):
    return list(
        children_collection.find(
            {"therapist_id": therapist_id}
        )
    )