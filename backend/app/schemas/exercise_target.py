from pydantic import BaseModel, Field


class ExerciseTargetCreate(BaseModel):
    exercise_id: str
    phoneme_id: str
    target_word: str = Field(min_length=1, max_length=100)


class ExerciseTargetResponse(BaseModel):
    id: str
    exercise_id: str
    phoneme_id: str
    target_word: str