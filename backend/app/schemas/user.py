from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6)


class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str