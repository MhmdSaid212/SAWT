from app.models.user import create_user, get_user_by_email
from app.utils.security import hash_password, verify_password
from app.utils.jwt import create_access_token

def register_user(name: str, email: str, password: str):
    existing_user = get_user_by_email(email)

    if existing_user:
        raise ValueError("Email already registered")

    hashed_password = hash_password(password)

    user_data = {
        "name": name,
        "email": email,
        "password_hash": hashed_password,
        "role": "parent",
    }

    return create_user(user_data)


def authenticate_user(email: str, password: str):
    user = get_user_by_email(email)

    if not user:
        return None

    if not verify_password(password, user["password_hash"]):
        return None

    access_token = create_access_token(
        user_id=str(user["_id"]),
        role=user["role"],
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
        },
    }