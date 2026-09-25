from app.models.user import create_user, get_user_by_email
from app.utils.security import hash_password


email = "admin@sawt.com"
password = "123456"


existing_user = get_user_by_email(email)

if existing_user:
    print("Admin account already exists.")
else:
    admin_data = {
        "name": "SAWT Admin",
        "email": email,
        "password_hash": hash_password(password),
        "role": "admin",
    }

    admin_id = create_user(admin_data)

    print("Admin account created successfully.")
    print(f"Admin ID: {admin_id}")
    print(f"Email: {email}")