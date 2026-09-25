from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from datetime import datetime, timezone
from app.schemas.attempt import AttemptCreate
from app.models.child import get_child_by_id
from app.models.exercise import get_exercise_by_id
from app.utils.auth import get_current_user
from pathlib import Path
from uuid import uuid4
from app.models.attempt import get_attempt_by_id
from app.models.audio_recording import create_audio_recording, get_audio_recording_by_attempt_id
from app.storage.storage import save_audio, get_audio_duration
from app.schemas import child
from app.services.pronunciation_service import transcribe_audio
from app.services.pronunciation_analysis_service import analyze_pronunciation
from app.models.attempt import create_attempt, update_attempt, get_attempts_by_child_id
from app.models.exercise_target import get_targets_by_exercise_id
from app.models.ai_analysis import create_ai_analysis, get_ai_analysis_by_attempt_id    
from app.models.phoneme import get_phoneme_by_symbol
from app.services.ai_feedback_service import generate_ai_feedback
from app.models.therapist import get_therapist_by_user_id
from app.models.parent import get_parent_by_user_id
from app.models.assignment import update_assignment_progress


router = APIRouter(
    prefix="/attempts",
    tags=["Attempts"],
)


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_new_attempt(
    attempt: AttemptCreate,
    current_user=Depends(get_current_user),
):
    if current_user["role"] != "child":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only children can create practice attempts",
        )

    child = get_child_by_id(attempt.child_id)

    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found",
        )

    if child["user_id"] != str(current_user["id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only create attempts for yourself",
        )

    exercise = get_exercise_by_id(attempt.exercise_id)

    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found",
        )


    

    attempt_data = attempt.model_dump()

    attempt_data["transcript"] = None
    attempt_data["ai_score"] = None
    attempt_data["ai_analysis"] = None

    attempt_id = create_attempt(attempt_data)

    return {
        "message": "Practice attempt created successfully",
        "attempt_id": attempt_id,
    }




@router.get("/child/{child_id}")
def get_child_attempts(
    child_id: str,
    current_user=Depends(get_current_user),
):
    if current_user["role"] != "child":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only children can view practice progress",
        )

    child = get_child_by_id(child_id)

    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found",
        )

    if child["user_id"] != str(current_user["id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own progress",
        )

    attempts = get_attempts_by_child_id(child_id)

    attempts.sort(
        key=lambda item: item.get("created_at", datetime.min),
        reverse=True,
    )

    completed_attempts = [
        attempt
        for attempt in attempts
        if attempt.get("ai_score") is not None
    ]

    scores = [
        float(attempt["ai_score"])
        for attempt in completed_attempts
    ]

    average_score = (
        round(sum(scores) / len(scores), 2)
        if scores
        else 0
    )

    return {
        "total_attempts": len(completed_attempts),
        "average_score": average_score,
        "attempts": [
            {
                "id": str(attempt["_id"]),
                "exercise_id": attempt.get("exercise_id"),
                "assignment_id": attempt.get("assignment_id"),
                "score": attempt.get("ai_score"),
                "feedback": attempt.get("ai_feedback"),
                "transcript": attempt.get("transcript"),
                "created_at": attempt.get("created_at"),
            }
            for attempt in completed_attempts
        ],
    }


@router.get("/therapist/child/{child_id}")
def get_therapist_child_attempts(
    child_id: str,
    current_user=Depends(get_current_user),
):
    if current_user["role"] != "therapist":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only therapists can view child practice history",
        )

    therapist = get_therapist_by_user_id(
        str(current_user["id"])
    )

    if not therapist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Therapist profile not found",
        )

    if therapist.get("verification_status") != "verified":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Therapist account is not verified",
        )

    child = get_child_by_id(child_id)

    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found",
        )

    if child.get("therapist_id") != str(therapist["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not assigned to this child",
        )

    attempts = get_attempts_by_child_id(child_id)

    attempts.sort(
        key=lambda item: item.get("created_at", datetime.min),
        reverse=True,
    )

    result = []

    for attempt in attempts:
        recording = get_audio_recording_by_attempt_id(
            str(attempt["_id"])
        )

        analyses = get_ai_analysis_by_attempt_id(
            str(attempt["_id"])
        )

        result.append(
            {
                "id": str(attempt["_id"]),
                "exercise_id": attempt.get("exercise_id"),
                "assignment_id": attempt.get("assignment_id"),
                "score": attempt.get("ai_score"),
                "transcript": attempt.get("transcript"),
                "ai_feedback": attempt.get("ai_feedback"),
                "therapist_feedback": attempt.get(
                    "therapist_feedback"
                ),
                "therapist_feedback_updated_at": attempt.get(
                    "therapist_feedback_updated_at"
                ),
                "recording": (
                    {
                        "file_url": recording.get("file_url"),
                        "duration_seconds": recording.get(
                            "duration_seconds", 0
                        ),
                    }
                    if recording
                    else None
                ),
                "ai_analysis": [
                    {
                        "target_phoneme_id": analysis.get(
                            "target_phoneme_id"
                        ),
                        "estimated_phoneme_id": analysis.get(
                            "estimated_phoneme_id"
                        ),
                        "confidence": analysis.get(
                            "confidence"
                        ),
                        "pronunciation_score": analysis.get(
                            "pronunciation_score"
                        ),
                        "details": analysis.get("details"),
                    }
                    for analysis in analyses
                ],
                "created_at": attempt.get("created_at"),
            }
        )

    return {
        "attempts": result,
        "total_attempts": len(result),
    }

@router.get("/{attempt_id}")
def get_attempt_details(
    attempt_id: str,
    current_user=Depends(get_current_user),
):
    attempt = get_attempt_by_id(attempt_id)

    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attempt not found",
        )

    child = get_child_by_id(attempt["child_id"])

    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found",
        )

    user_id = str(current_user["id"])
    role = current_user["role"]

    # CHILD
    if role == "child":
        if child["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own attempts",
            )

    # PARENT
    elif role == "parent":
        if child["parent_id"] != user_id and child["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this attempt",
            )

    # THERAPIST
    elif role == "therapist":
        therapist = get_therapist_by_user_id(user_id)

        if not therapist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Therapist profile not found",
            )

        if therapist.get("verification_status") != "verified":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Therapist account is not verified",
            )

        if child.get("therapist_id") != str(therapist["_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not assigned to this child",
            )

    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this attempt",
        )

    recording = get_audio_recording_by_attempt_id(attempt_id)

    analyses = get_ai_analysis_by_attempt_id(attempt_id)

    return {
        "id": str(attempt["_id"]),
        "child_id": attempt.get("child_id"),
        "exercise_id": attempt.get("exercise_id"),
        "assignment_id": attempt.get("assignment_id"),
        "transcript": attempt.get("transcript"),
        "ai_score": attempt.get("ai_score"),
        "ai_feedback": attempt.get("ai_feedback"),
        "therapist_feedback": attempt.get("therapist_feedback"),
        "therapist_feedback_updated_at": attempt.get(
            "therapist_feedback_updated_at"
        ),
        "recording": (
            {
                "id": str(recording["_id"]),
                "file_url": recording.get("file_url"),
                "duration_seconds": recording.get(
                    "duration_seconds", 0
                ),
                "created_at": recording.get("created_at"),
            }
            if recording
            else None
        ),
        "ai_analysis": [
            {
                "id": str(analysis["_id"]),
                "target_phoneme_id": analysis.get(
                    "target_phoneme_id"
                ),
                "estimated_phoneme_id": analysis.get(
                    "estimated_phoneme_id"
                ),
                "confidence": analysis.get("confidence"),
                "pronunciation_score": analysis.get(
                    "pronunciation_score"
                ),
                "details": analysis.get("details"),
                "created_at": analysis.get("created_at"),
            }
            for analysis in analyses
        ],
        "created_at": attempt.get("created_at"),
    }


@router.patch("/{attempt_id}/therapist-feedback")
def update_therapist_feedback(
    attempt_id: str,
    feedback_data: dict,
    current_user=Depends(get_current_user),
):
    if current_user["role"] != "therapist":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only therapists can update therapist feedback",
        )

    therapist = get_therapist_by_user_id(
        str(current_user["id"])
    )

    if not therapist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Therapist profile not found",
        )

    if therapist.get("verification_status") != "verified":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Therapist account is not verified",
        )

    attempt = get_attempt_by_id(attempt_id)

    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attempt not found",
        )

    child = get_child_by_id(attempt["child_id"])

    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found",
        )

    if child.get("therapist_id") != str(therapist["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not assigned to this child",
        )

    therapist_feedback = feedback_data.get(
        "therapist_feedback"
    )

    if therapist_feedback is not None:
        therapist_feedback = therapist_feedback.strip()

    if not therapist_feedback:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Therapist feedback cannot be empty",
        )

    updated_at = datetime.now(timezone.utc)

    updated = update_attempt(
        attempt_id,
        {
            "therapist_feedback": therapist_feedback,
            "therapist_feedback_updated_at": updated_at,
            "therapist_feedback_updated_by": str(
                therapist["_id"]
            ),
        },
    )

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update therapist feedback",
        )

    return {
        "message": "Therapist feedback updated successfully",
        "attempt_id": attempt_id,
        "therapist_feedback": therapist_feedback,
        "updated_at": updated_at,
    }




@router.post("/{attempt_id}/audio")
async def upload_attempt_audio(
    attempt_id: str,
    audio: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    if current_user["role"] != "child":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only children can upload audio",
        )

    attempt = get_attempt_by_id(attempt_id)

    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attempt not found",
        )

    child = get_child_by_id(attempt["child_id"])

    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child profile not found",
        )

    if child["user_id"] != str(current_user["id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only upload audio for your own attempts",
        )
    
    exercise = get_exercise_by_id(attempt["exercise_id"])

    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found",
        )

    targets = get_targets_by_exercise_id(
    attempt["exercise_id"]
)

    if not targets:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Exercise has no target words",
        )

    target_word = targets[0]["target_word"]



        

    allowed_types = {
    "audio/wav",
    "audio/x-wav",
    "audio/mpeg",
    "audio/mp4",
    "audio/webm",
    "audio/webm;codecs=opus",
    "audio/ogg",
    "audio/ogg;codecs=opus",
}

    if audio.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported audio format",
        )

    extension = Path(audio.filename or "").suffix or ".webm"
    filename = f"{uuid4()}{extension}"

    file_path = save_audio(audio, filename)

    file_url = f"/storage/audio/{filename}"

    duration_seconds = get_audio_duration(file_path)

    audio_path = file_path

    transcript = transcribe_audio(audio_path)

    pronunciation_result = analyze_pronunciation(
        audio_path=audio_path,
        expected_text=target_word,
    )



    mismatches = pronunciation_result["mismatches"]

    if mismatches:
        for mismatch in mismatches:
            target_phoneme = get_phoneme_by_symbol(
                mismatch["expected"]
            )

            estimated_phoneme = get_phoneme_by_symbol(
                mismatch["heard"]
            )
            create_ai_analysis(
                {
                    "attempt_id": attempt_id,
                    "target_phoneme_id": (
                        str(target_phoneme["_id"])
                        if target_phoneme
                        else None
                    ),
                    "estimated_phoneme_id": (
                        str(estimated_phoneme["_id"])
                        if estimated_phoneme
                        else None
                    ),
                    "confidence": mismatch["recognition_confidence"],
                    "pronunciation_score": round(
                        (1 - pronunciation_result["phoneme_error_rate"]) * 100,
                        2,
                    ),
                    "details": (
                        f"Expected '{mismatch['expected']}' "
                        f"but heard '{mismatch['heard']}' "
                        f"at position {mismatch['position']}."
                    ),
                }
            )
    else:
        create_ai_analysis(
            {
                "attempt_id": attempt_id,
                "target_phoneme_id": None,
                "estimated_phoneme_id": None,
                "confidence": 1.0,
                "pronunciation_score": 100.0,
                "details": "No phoneme mismatches detected.",
            }
        )


    recording_data = {
        "attempt_id": attempt_id,
        "file_url": file_url,
        "duration_seconds": duration_seconds,
    }

    recording_id = create_audio_recording(recording_data)

  

    update_attempt(
    attempt_id,
    {
        "transcript": transcript,
        "ai_score": round(
            (1 - pronunciation_result["phoneme_error_rate"]) * 100,
            2,
        ),
        "ai_analysis": pronunciation_result,
    },
)

    pronunciation_score = round(
    (1 - pronunciation_result["phoneme_error_rate"]) * 100,
    2,
)

    # Update assignment progress
    if attempt.get("assignment_id"):
        update_assignment_progress(
            assignment_id=attempt["assignment_id"],
            score=pronunciation_score,
        )

    ai_feedback = generate_ai_feedback(
        expected_word=target_word,
        transcript=transcript,
        pronunciation_score=pronunciation_score,
        analysis_details=(
            "No phoneme mismatches detected."
            if not mismatches
            else "; ".join(
                f"Expected '{mismatch['expected']}' "
                f"but heard '{mismatch['heard']}'"
                for mismatch in mismatches
            )
        ),
    )

    update_attempt(
        attempt_id,
        {
            "ai_feedback": ai_feedback,
        },
    )

    return {
        "message": "Audio uploaded successfully",
        "attempt_id": attempt_id,
        "recording_id": recording_id,
        "file_url": file_url,
        "transcript": transcript,
        "ai_score": pronunciation_score,
        "ai_feedback": ai_feedback,
    }




@router.get("/parent/summary")
def get_parent_attempt_summary(
    current_user=Depends(get_current_user),
):
    if current_user["role"] != "parent":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only parents can view parent progress",
        )

    from app.models.child import get_children_by_parent_id
    from app.models.attempt import get_attempts_by_child_ids

    children = get_children_by_parent_id(
        str(current_user["id"])
    )

    child_ids = [
        str(child["_id"])
        for child in children
    ]

    if not child_ids:
        return {
            "children_count": 0,
            "total_attempts": 0,
            "average_score": 0,
            "weekly_activity": [],
            "children": [],
            "recent_attempts": [],
        }

    attempts = get_attempts_by_child_ids(child_ids)

    completed_attempts = [
        attempt
        for attempt in attempts
        if attempt.get("ai_score") is not None
    ]

    scores = [
        float(attempt["ai_score"])
        for attempt in completed_attempts
    ]

    average_score = (
        round(sum(scores) / len(scores), 2)
        if scores
        else 0
    )

    children_map = {
        str(child["_id"]): child
        for child in children
    }

    child_stats = []

    for child in children:
        child_id = str(child["_id"])

        child_attempts = [
            attempt
            for attempt in completed_attempts
            if attempt.get("child_id") == child_id
        ]

        child_scores = [
            float(attempt["ai_score"])
            for attempt in child_attempts
        ]

        child_average = (
            round(
                sum(child_scores) / len(child_scores),
                2,
            )
            if child_scores
            else 0
        )

        child_best = (
            max(child_scores)
            if child_scores
            else 0
        )

        child_stats.append(
            {
                "child_id": child_id,
                "name": child["full_name"],
                "attempts": len(child_attempts),
                "average_score": child_average,
                "best_score": child_best,
            }
        )

    completed_attempts.sort(
        key=lambda attempt: attempt.get(
            "created_at",
            datetime.min.replace(tzinfo=timezone.utc),
        ),
        reverse=True,
    )

    recent_attempts = []

    for attempt in completed_attempts[:10]:
        child = children_map.get(
            attempt.get("child_id")
        )

        recent_attempts.append(
            {
                "id": str(attempt["_id"]),
                "child_id": attempt.get("child_id"),
                "child_name": (
                    child["full_name"]
                    if child
                    else "Unknown"
                ),
                "exercise_id": attempt.get(
                    "exercise_id"
                ),
                "score": attempt.get("ai_score"),
                "feedback": attempt.get(
                    "ai_feedback"
                ),
                "created_at": attempt.get(
                    "created_at"
                ),
            }
        )

    now = datetime.now(timezone.utc)

    weekly_activity = []

    for offset in range(6, -1, -1):
        day = now.date()

        from datetime import timedelta

        target_day = day - timedelta(days=offset)

        count = 0

        for attempt in completed_attempts:
            created_at = attempt.get("created_at")

            if not created_at:
                continue

            if created_at.date() == target_day:
                count += 1

        weekly_activity.append(
            {
                "date": target_day.isoformat(),
                "count": count,
            }
        )

    return {
        "children_count": len(children),
        "total_attempts": len(completed_attempts),
        "average_score": average_score,
        "weekly_activity": weekly_activity,
        "children": child_stats,
        "recent_attempts": recent_attempts,
    }