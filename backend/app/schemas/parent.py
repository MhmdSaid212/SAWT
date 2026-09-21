from pydantic import BaseModel, Field


class ParentCreate(BaseModel):
    phone_number: str | None = None
    relationship: str | None = None


class ParentResponse(BaseModel):
    id: str
    user_id: str
    phone_number: str | None
    relationship: str | None