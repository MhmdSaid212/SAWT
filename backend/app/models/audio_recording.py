from datetime import datetime, timezone

from pymongo import ASCENDING

from app.db.database import db

audio_recordings_collection = db["audio_recordings"]

audio_recordings_collection.create_index(
    [("attempt_id", ASCENDING)],
    unique=True,
)


def create_audio_recording(recording_data: dict):
    print("RECORDING DATA BEFORE SAVE:", recording_data)

    now = datetime.now(timezone.utc)
    recording_data["created_at"] = now

    result = audio_recordings_collection.insert_one(recording_data)

    print("RECORDING SAVED:", recording_data)

    return str(result.inserted_id)


def get_audio_recording_by_attempt_id(attempt_id: str):
    return audio_recordings_collection.find_one(
        {
            "attempt_id": attempt_id
        }
    )