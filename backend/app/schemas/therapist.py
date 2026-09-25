from datetime import datetime
from pydantic import BaseModel, Field


class TherapistCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: str
    password: str = Field(min_length=6)
    specialization: str
    license_number: str
    bio: str | None = None


class TherapistUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )
    email: str | None = None
    password: str | None = Field(
        default=None,
        min_length=6,
    )
    specialization: str | None = None
    license_number: str | None = None
    bio: str | None = None

class TherapistResponse(BaseModel):
    id: str
    user_id: str
    specialization: str
    license_number: str
    bio: str | None = None
    verification_status: str
    verified_by: str | None = None
    verified_at: datetime | None = None
    created_at: datetime
    updated_at: datetime