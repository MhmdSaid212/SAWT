from app.models.user import create_user, get_user_by_email
from app.models.child import create_child
from app.utils.security import hash_password


email = "parentdeletetest@sawt.com"
password = "123456"

parent_user_id = "6ab3a92afef7b7002d688bfd"

existing_user = get_user_by_email(email)

if existing_user:
    print("Test child already exists.")
else:
    user_data = {
        "name": "Parent Delete Test Child",
        "email": email,
        "password_hash": hash_password(password),
        "role": "child",
    }

    user_id = create_user(user_data)

    child_data = {
        "user_id": user_id,
        "parent_id": parent_user_id,
        "full_name": "Parent Delete Test Child",
        "date_of_birth": "2018-05-10",
        "language_preference": "English",
        "avatar_url": None,
    }

    child_id = create_child(child_data)

    print("Test child created successfully.")
    print(f"User ID: {user_id}")
    print(f"Child ID: {child_id}")