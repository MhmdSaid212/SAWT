from pydantic import BaseModel


class ExerciseTargetCreate(BaseModel):
    phoneme_id: str
    target_word: str
    visual_emoji: str | None = None


class ExerciseCreate(BaseModel):
    title: str
    description: str | None = None
    language: str
    difficulty_level: str
    visual_emoji: str | None = None
    targets: list[ExerciseTargetCreate] = []


class ExerciseUpdate(BaseModel):
    title: str
    description: str | None = None
    language: str
    difficulty_level: str
    visual_emoji: str | None = None
    targets: list[ExerciseTargetCreate] = []