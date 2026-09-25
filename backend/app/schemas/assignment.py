from datetime import date, datetime

from pydantic import BaseModel


class AssignmentCreate(BaseModel):
    child_id: str
    exercise_id: str
    due_date: date
    status: str = "assigned"


class AssignmentUpdate(BaseModel):
    exercise_id: str
    due_date: date


class AssignmentResponse(BaseModel):
    id: str
    child_id: str
    exercise_id: str
    assigned_by: str
    assigned_at: datetime
    due_date: date
    status: str
    created_at: datetime
    updated_at: datetime