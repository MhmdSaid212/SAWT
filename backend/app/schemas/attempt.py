from datetime import datetime

from pydantic import BaseModel


class AttemptCreate(BaseModel):
    child_id: str
    exercise_id: str
    assignment_id: str | None = None


class AttemptResponse(BaseModel):
    id: str
    child_id: str
    exercise_id: str
    assignment_id: str | None = None
    transcript: str | None = None
    ai_score: float | None = None
    ai_analysis: str | None = None
    created_at: datetime
    updated_at: datetime