from pydantic import BaseModel


class ExerciseTargetCreate(BaseModel):
    phoneme_id: str
    target_word: str


class ExerciseCreate(BaseModel):
    title: str
    description: str | None = None
    language: str
    difficulty_level: str
    targets: list[ExerciseTargetCreate] = []


class ExerciseUpdate(BaseModel):
    title: str
    description: str | None = None
    language: str
    difficulty_level: str
    targets: list[ExerciseTargetCreate] = []