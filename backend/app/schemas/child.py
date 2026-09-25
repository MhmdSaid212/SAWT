from datetime import date

from pydantic import BaseModel, Field


class ChildCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    date_of_birth: date
    language_preference: str
    avatar_url: str | None = None

    email: str
    password: str = Field(min_length=6)

class ChildResponse(BaseModel):
    id: str
    user_id: str
    full_name: str
    date_of_birth: date
    language_preference: str
    avatar_url: str | None