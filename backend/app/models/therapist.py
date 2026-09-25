from datetime import datetime, timezone

from pymongo import ASCENDING

from app.db.database import db
from app.models.user import get_user_by_id, update_user, delete_user

therapists_collection = db["therapists"]

therapists_collection.create_index(
    [("user_id", ASCENDING)],
    unique=True,
)

therapists_collection.create_index(
    [("license_number", ASCENDING)],
    unique=True,
)


def create_therapist(therapist_data: dict):
    now = datetime.now(timezone.utc)

    therapist_data["created_at"] = now
    therapist_data["updated_at"] = now

    result = therapists_collection.insert_one(therapist_data)

    return str(result.inserted_id)


def get_therapist_by_id(therapist_id: str):
    from bson import ObjectId

    try:
        return therapists_collection.find_one(
            {"_id": ObjectId(therapist_id)}
        )
    except Exception:
        return None


def get_therapist_by_user_id(user_id: str):
    return therapists_collection.find_one(
        {"user_id": user_id}
    )


def get_therapists():
    return list(
        therapists_collection.find()
    )


def verify_therapist(therapist_id: str, verified_by: str):
    from bson import ObjectId

    try:
        result = therapists_collection.update_one(
            {"_id": ObjectId(therapist_id)},
            {
                "$set": {
                    "verification_status": "verified",
                    "verified_by": verified_by,
                    "verified_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )

        return result.modified_count > 0

    except Exception:
        return False



def update_therapist(
    therapist_id: str,
    update_data: dict,
):
    from bson import ObjectId

    try:
        therapist = therapists_collection.find_one(
            {"_id": ObjectId(therapist_id)}
        )

        if not therapist:
            return False

        user_updates = {}

        if "name" in update_data:
            user_updates["name"] = update_data.pop("name")

        if "email" in update_data:
            user_updates["email"] = update_data.pop("email")

        if "password" in update_data:
            from app.utils.security import hash_password

            password = update_data.pop("password")

            if password:
                user_updates["password_hash"] = hash_password(password)

        if user_updates:
            update_user(
                therapist["user_id"],
                user_updates,
            )

        if update_data:
            update_data["updated_at"] = datetime.now(timezone.utc)

            therapists_collection.update_one(
                {"_id": ObjectId(therapist_id)},
                {"$set": update_data},
            )

        return True

    except Exception:
        return False

def delete_therapist(therapist_id: str):
    from bson import ObjectId

    try:
        therapist = therapists_collection.find_one(
            {"_id": ObjectId(therapist_id)}
        )

        if not therapist:
            return False

        user_id = therapist["user_id"]

        therapist_result = therapists_collection.delete_one(
            {"_id": ObjectId(therapist_id)}
        )

        if therapist_result.deleted_count == 0:
            return False

        delete_user(user_id)

        return True

    except Exception:
        return False