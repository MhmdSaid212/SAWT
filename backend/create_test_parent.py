from app.models.user import create_user, get_user_by_email
from app.models.parent import create_parent
from app.utils.security import hash_password


email = "parent@sawt.com"
password = "123456"

existing_user = get_user_by_email(email)

if existing_user:
    print("Parent already exists.")
else:
    user_data = {
        "name": "Test Parent",
        "email": email,
        "password_hash": hash_password(password),
        "role": "parent",
    }

    user_id = create_user(user_data)

    parent_data = {
        "user_id": user_id,
        "phone_number": None,
        "relationship": "Parent",
    }

    parent_id = create_parent(parent_data)

    print("Test parent created successfully.")
    print(f"User ID: {user_id}")
    print(f"Parent ID: {parent_id}")