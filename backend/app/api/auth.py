from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.user import UserCreate, UserLogin
from app.services.auth_service import authenticate_user, register_user
from app.utils.auth import get_current_user
from app.utils.jwt import create_access_token
from app.models.child import get_child_by_id
from app.models.user import get_user_by_id, update_user

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post("/register")
def register(user: UserCreate):
    try:
        user_id = register_user(
            name=user.name,
            email=user.email,
            password=user.password,
        )

        return {
            "message": "User registered successfully",
            "user_id": user_id,
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )


@router.post("/login")
def login(user: UserLogin):
    authenticated_user = authenticate_user(
        email=user.email,
        password=user.password,
    )

    if not authenticated_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    return authenticated_user





@router.get("/me")
def get_me(
    current_user=Depends(get_current_user),
):
    user = get_user_by_id(str(current_user["id"]))

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return {
        "id": str(user["_id"]),
        "name": user.get("name"),
        "email": user.get("email"),
        "role": user.get("role"),
    }


@router.post("/parent/enter-child/{child_id}")
def enter_child(
    child_id: str,
    current_user=Depends(get_current_user),
):
    # Only parents can enter a child practice session.
    if current_user["role"] != "parent":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only parents can enter child practice sessions",
        )

    child = get_child_by_id(child_id)

    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found",
        )

    # Make sure this child actually belongs to the logged-in parent.
    if child.get("parent_id") != str(current_user["id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only enter your own child's practice session",
        )

    child_user_id = child.get("user_id")

    if not child_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Child does not have a valid user account",
        )

    # Create a normal child JWT.
    # Existing child-only endpoints will therefore continue
    # enforcing the child's identity normally.
    child_token = create_access_token(
        user_id=str(child_user_id),
        role="child",
    )

    return {
        "message": "Child practice session started",
        "token": child_token,
        "child_id": str(child["_id"]),
        "child_name": child.get("full_name"),
    }



@router.patch("/me")
def update_me(
    profile_data: dict,
    current_user=Depends(get_current_user),
):
    if current_user["role"] != "parent":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only parents can update their profile",
        )

    user_id = str(current_user["id"])

    user = get_user_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    update_data = {}

    if "name" in profile_data:
        name = str(profile_data["name"]).strip()

        if not name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Name cannot be empty",
            )

        update_data["name"] = name

    if "email" in profile_data:
        email = str(profile_data["email"]).strip().lower()

        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email cannot be empty",
            )

        update_data["email"] = email

    if "password" in profile_data:
        password = str(profile_data["password"])

        if password:
            from app.utils.security import hash_password

            update_data["password_hash"] = hash_password(password)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No profile changes provided",
        )

    update_user(user_id, update_data)

    updated_user = get_user_by_id(user_id)

    return {
        "id": str(updated_user["_id"]),
        "name": updated_user.get("name"),
        "email": updated_user.get("email"),
        "role": updated_user.get("role"),
    }

