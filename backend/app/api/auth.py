from fastapi import APIRouter, HTTPException

from app.schemas.user import UserCreate, UserLogin
from app.services.auth_service import authenticate_user, register_user


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