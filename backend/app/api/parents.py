from fastapi import APIRouter, Depends, HTTPException

from app.models.parent import create_parent, get_parent_by_user_id
from app.schemas.parent import ParentCreate
from app.utils.roles import require_role


router = APIRouter(
    prefix="/parents",
    tags=["Parents"],
)


@router.post("/profile")
def create_parent_profile(
    parent: ParentCreate,
    current_user=Depends(require_role("parent")),
):
    existing_parent = get_parent_by_user_id(current_user["id"])

    if existing_parent:
        raise HTTPException(
            status_code=400,
            detail="Parent profile already exists",
        )

    parent_data = {
        "user_id": current_user["id"],
        "phone_number": parent.phone_number,
        "relationship": parent.relationship,
    }

    parent_id = create_parent(parent_data)

    return {
        "message": "Parent profile created successfully",
        "parent_id": parent_id,
    }