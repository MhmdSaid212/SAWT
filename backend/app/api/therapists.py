from fastapi import APIRouter, Depends, HTTPException, status

from app.utils.auth import get_current_user
from app.models.therapist import (create_therapist,get_therapist_by_user_id,get_therapists,verify_therapist, update_therapist, delete_therapist)
from app.models.user import create_user, get_user_by_email, get_user_by_id
from app.schemas.therapist import TherapistCreate, TherapistUpdate
from app.utils.security import hash_password
from datetime import datetime, timezone
from app.models.audit_log import create_audit_log


router = APIRouter(
    prefix="/therapists",
    tags=["Therapists"],
)


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_new_therapist(
    therapist: TherapistCreate,
    current_user=Depends(get_current_user),
):

    if current_user["role"] != "admin":
        raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Only admins can manage therapists",
    )
    existing_user = get_user_by_email(therapist.email)

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )

    user_data = {
        "name": therapist.name,
        "email": therapist.email,
        "password_hash": hash_password(therapist.password),
        "role": "therapist",
    }

    user_id = create_user(user_data)

    therapist_data = {
        "user_id": user_id,
        "specialization": therapist.specialization,
        "license_number": therapist.license_number,
        "bio": therapist.bio,
        "verification_status": "pending",
        "verified_by": None,
        "verified_at": None,
    }

    therapist_id = create_therapist(therapist_data)

    create_audit_log(
        actor_user_id=str(current_user["id"]),
        action="create_therapist",
        entity_type="therapist",
        entity_id=therapist_id,
    )

    return {
        "message": "Therapist created successfully",
        "therapist_id": therapist_id,
        "user_id": user_id,
        "verification_status": "pending",
    }


@router.get("/")
def list_therapists(
    current_user=Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can manage therapists",
        )

    therapists = get_therapists()

    result = []

    for therapist in therapists:
        user = get_user_by_id(therapist["user_id"])

        result.append(
            {
                "id": str(therapist["_id"]),
                "user_id": therapist["user_id"],
                "name": user["name"] if user else None,
                "email": user["email"] if user else None,
                "specialization": therapist["specialization"],
                "license_number": therapist["license_number"],
                "bio": therapist.get("bio"),
                "verification_status": therapist["verification_status"],
                "verified_by": therapist.get("verified_by"),
                "verified_at": therapist.get("verified_at"),
            }
        )

    return {
        "therapists": result
    }




@router.get("/me")
def get_my_therapist_profile(
    current_user=Depends(get_current_user),
):
    if current_user["role"] != "therapist":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only therapists can access their profile",
        )

    therapist = get_therapist_by_user_id(
        str(current_user["id"])
    )

    if not therapist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Therapist profile not found",
        )

    return {
        "id": str(therapist["_id"]),
        "user_id": therapist["user_id"],
        "specialization": therapist.get("specialization"),
        "license_number": therapist.get("license_number"),
        "bio": therapist.get("bio"),
        "verification_status": therapist.get(
            "verification_status"
        ),
        "verified_by": therapist.get("verified_by"),
        "verified_at": therapist.get("verified_at"),
    }



@router.patch("/{therapist_id}/verify")
def verify_therapist_account(
    therapist_id: str,
    current_user=Depends(get_current_user),
):
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can verify therapists",
        )

    verified = verify_therapist(
        therapist_id,
        str(current_user["id"]),
    )


    if verified:
        create_audit_log(
            actor_user_id=str(current_user["id"]),
            action="verify_therapist",
            entity_type="therapist",
            entity_id=therapist_id,
        )

    if not verified:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Therapist not found",
        )

    return {
        "message": "Therapist verified successfully",
        "therapist_id": therapist_id,
    }


@router.patch("/{therapist_id}")
def update_therapist_account(
    therapist_id: str,
    therapist: TherapistUpdate,
    current_user=Depends(get_current_user),
):
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update therapists",
        )

    update_data = therapist.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided for update",
        )

    updated = update_therapist(
        therapist_id,
        update_data,
    )

    if updated:
        create_audit_log(
            actor_user_id=str(current_user["id"]),
            action="update_therapist",
            entity_type="therapist",
            entity_id=therapist_id,
        )

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Therapist not found",
        )

    return {
        "message": "Therapist updated successfully",
        "therapist_id": therapist_id,
    }




@router.delete("/{therapist_id}")
def delete_therapist_account(
    therapist_id: str,
    current_user=Depends(get_current_user),
):
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete therapists",
        )

    deleted = delete_therapist(therapist_id)

    if deleted:
        create_audit_log(
            actor_user_id=str(current_user["id"]),
            action="delete_therapist",
            entity_type="therapist",
            entity_id=therapist_id,
        )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Therapist not found",
        )

    return {
        "message": "Therapist deleted successfully",
        "therapist_id": therapist_id,
    }