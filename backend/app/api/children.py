from fastapi import APIRouter, Depends, HTTPException

from app.models.child import (create_child, get_children_by_parent_id, get_child_by_id,)
from app.schemas.child import ChildCreate
from app.utils.roles import require_role

router = APIRouter(
    prefix="/children",
    tags=["Children"],
)


@router.post("/")
def create_child_profile(
    child: ChildCreate,
    current_user=Depends(require_role("parent")),
):
    child_data = {
        "user_id": current_user["id"],
        "full_name": child.full_name,
        "date_of_birth": child.date_of_birth.isoformat(),
        "language_preference": child.language_preference,
        "avatar_url": child.avatar_url,
    }

    child_id = create_child(child_data)

    return {
        "message": "Child created successfully",
        "child_id": child_id,
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



@router.get("/{child_id}")
def get_child_details(
    child_id: str,
    current_user=Depends(require_role("parent")),
):
    child = get_child_by_id(child_id)

    if not child:
        raise HTTPException(
            status_code=404,
            detail="Child not found",
        )

    if child["user_id"] != current_user["id"]:
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