from datetime import datetime

from pydantic import BaseModel


class TherapistExerciseCreate(BaseModel):
    exercise_id: str
    customization_notes: str | None = None


class TherapistExerciseResponse(BaseModel):
    id: str
    therapist_id: str
    exercise_id: str
    customization_notes: str | None
    created_at: datetime
    updated_at: datetime