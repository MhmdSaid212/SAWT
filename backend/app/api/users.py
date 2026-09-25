from fastapi import APIRouter, Depends, HTTPException, status

from app.models.user import get_users, delete_user, get_user_by_id
from app.utils.auth import get_current_user
from app.models.audit_log import create_audit_log
from app.models.child import get_child_by_user_id, delete_child, get_children_by_parent_id
from app.models.parent import get_parent_by_user_id, delete_parent


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.get("/")
def list_users(
    current_user=Depends(get_current_user),
):
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can manage users",
        )

    users = get_users()

    result = []

    for user in users:
        result.append(
            {
                "id": str(user["_id"]),
                "name": user.get("name"),
                "email": user.get("email"),
                "role": user.get("role"),
                "created_at": user.get("created_at"),
                "updated_at": user.get("updated_at"),
            }
        )

    return {
        "users": result
    }




@router.delete("/{user_id}")
def delete_user_account(
    user_id: str,
    current_user=Depends(get_current_user),
):
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete users",
        )

    if user_id == str(current_user["id"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own administrator account",
        )

    user = get_user_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    if user.get("role") == "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrator accounts cannot be deleted",
        )

    if user.get("role") == "child":
        child = get_child_by_user_id(user_id)



        if child:
            delete_child(str(child["_id"]))



    if user.get("role") == "parent":
        parent = get_parent_by_user_id(user_id)

        if parent:
            children = get_children_by_parent_id(
                user_id
            )

            if children:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot delete a parent account while children are linked to it",
                )

            delete_parent(str(parent["_id"]))

    if user.get("role") == "therapist":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Therapists must be managed through therapist management",
        )

    deleted = delete_user(user_id)

    if deleted:
        create_audit_log(
            actor_user_id=str(current_user["id"]),
            action="delete_user",
            entity_type="user",
            entity_id=user_id,
        )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return {
        "message": "User deleted successfully",
        "user_id": user_id,
    }