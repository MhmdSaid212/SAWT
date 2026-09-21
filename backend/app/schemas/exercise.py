from pydantic import BaseModel, Field


class ExerciseCreate(BaseModel):
    title: str = Field(min_length=2, max_length=150)
    description: str | None = None
    language: str = Field(min_length=2, max_length=20)
    difficulty_level: str = Field(min_length=1, max_length=30)
    created_by: str


class ExerciseResponse(BaseModel):
    id: str
    title: str
    description: str | None
    language: str
    difficulty_level: str
    created_by: str