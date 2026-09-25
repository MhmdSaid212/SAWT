from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.models.child import (create_child, get_children_by_parent_id, get_child_by_id, get_child_by_user_id)
from app.schemas.child import ChildCreate
from app.utils.roles import require_role
from app.utils.auth import get_current_user
from app.models.user import create_user, get_user_by_email
from app.utils.security import hash_password
from app.models.assignment import get_assignments_by_therapist_id
from datetime import datetime, timezone
from bson import ObjectId
from app.models.therapist import get_therapist_by_id, get_therapist_by_user_id
from app.db.database import db


children_collection = db["children"]


class TherapistAssignment(BaseModel):
    therapist_id: str


router = APIRouter(
    prefix="/children",
    tags=["Children"],
)



@router.post("/")
def create_child_profile(
    child: ChildCreate,
    current_user=Depends(require_role("parent")),
):
    existing_user = get_user_by_email(child.email)

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists",
        )

    child_user_data = {
        "name": child.full_name,
        "email": child.email,
        "password_hash": hash_password(child.password),
        "role": "child",
    }

    child_user_id = create_user(child_user_data)

    child_data = {
        "user_id": child_user_id,
        "parent_id": current_user["id"],
        "full_name": child.full_name,
        "date_of_birth": child.date_of_birth.isoformat(),
        "language_preference": child.language_preference,
        "avatar_url": child.avatar_url,
    }

    child_id = create_child(child_data)

    return {
        "message": "Child created successfully",
        "child_id": child_id,
        "user_id": child_user_id,
    }


@router.get("/")
def get_my_children(
    current_user=Depends(require_role("parent")),
):
    children = get_children_by_parent_id(current_user["id"])

    return {
        "children": [
            {
                "id": str(child["_id"]),
                "user_id": child["user_id"],
                "full_name": child["full_name"],
                "date_of_birth": child["date_of_birth"],
                "language_preference": child["language_preference"],
                "avatar_url": child.get("avatar_url"),
            }
            for child in children
        ]
    }

@router.get("/me")
def get_my_child_profile(
    current_user=Depends(require_role("child")),
):
    child = get_child_by_user_id(current_user["id"])

    if not child:
        raise HTTPException(
            status_code=404,
            detail="Child profile not found",
        )

    return {
        "child": {
            "id": str(child["_id"]),
            "user_id": child["user_id"],
            "full_name": child["full_name"],
            "date_of_birth": child["date_of_birth"],
            "language_preference": child["language_preference"],
            "avatar_url": child.get("avatar_url"),
        }
    }

@router.patch("/{child_id}/therapist")
def assign_therapist_to_child(
    child_id: str,
    assignment: TherapistAssignment,
    current_user=Depends(require_role("admin")),
):
    child = get_child_by_id(child_id)

    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found",
        )

    therapist = get_therapist_by_id(assignment.therapist_id)

    if not therapist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Therapist not found",
        )

    if therapist.get("verification_status") != "verified":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Therapist must be verified before being assigned to a child",
        )

    children_collection.update_one(
        {"_id": ObjectId(child_id)},
        {
            "$set": {
                "therapist_id": assignment.therapist_id,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

    return {
        "message": "Therapist assigned to child successfully",
        "child_id": child_id,
        "therapist_id": assignment.therapist_id,
    }


@router.get("/by-user/{user_id}")
def get_child_by_user(
    user_id: str,
    current_user=Depends(require_role("admin")),
):
    child = get_child_by_user_id(user_id)

    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child profile not found",
        )

    return {
        "child": {
            "id": str(child["_id"]),
            "user_id": child["user_id"],
            "full_name": child["full_name"],
            "date_of_birth": child["date_of_birth"],
            "language_preference": child["language_preference"],
            "avatar_url": child.get("avatar_url"),
            "therapist_id": child.get("therapist_id"),
        }
    }



@router.get("/{child_id}")
def get_child_details(
    child_id: str,
    current_user=Depends(get_current_user),
):
    child = get_child_by_id(child_id)

    if not child:
        raise HTTPException(
            status_code=404,
            detail="Child not found",
        )

    if current_user["role"] == "parent":
        if child["parent_id"] != current_user["id"]:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to access this child",
            )

    elif current_user["role"] == "therapist":
        therapist = get_therapist_by_user_id(
            str(current_user["id"])
        )

        if not therapist:
            raise HTTPException(
                status_code=404,
                detail="Therapist profile not found",
            )

        if child.get("therapist_id") != str(therapist["_id"]):
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to access this child",
            )

    else:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to access this child",
        )

    return {
        "id": str(child["_id"]),
        "user_id": child["user_id"],
        "full_name": child["full_name"],
        "date_of_birth": child["date_of_birth"],
        "language_preference": child["language_preference"],
        "avatar_url": child.get("avatar_url"),
    }