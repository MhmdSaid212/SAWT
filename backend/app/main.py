from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.api.auth import router as auth_router
from fastapi import Depends
from app.utils.auth import get_current_user
from app.api.parents import router as parents_router
from app.api.children import router as children_router
from app.api.phonemes import router as phonemes_router
from app.api.exercises import router as exercises_router
from app.api.therapist_exercises import router as therapist_exercises_router
from app.api.assignments import router as assignments_router
from app.api.attempts import router as attempts_router
from app.api.therapists import router as therapists_router
from app.api.users import router as users_router
from app.api.audit_logs import router as audit_logs_router
from fastapi.staticfiles import StaticFiles
from app.api.ai_exercises import router as ai_exercises_router

app = FastAPI(
    title="SAWT API",
    description="AI-assisted speech therapy companion API",
    version="1.0.0",
)

app.mount(
    "/storage",
    StaticFiles(directory="storage"),
    name="storage",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(parents_router)
app.include_router(children_router)
app.include_router(phonemes_router)
app.include_router(exercises_router)
app.include_router(therapist_exercises_router)
app.include_router(assignments_router)
app.include_router(attempts_router)
app.include_router(therapists_router)
app.include_router(users_router)
app.include_router(audit_logs_router)
app.include_router(ai_exercises_router)

@app.get("/")
def root():
    return {
        "message": "SAWT API is running",
        "status": "success",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
    }



@app.get("/me")
def get_me(current_user=Depends(get_current_user)):
    return {
        "message": "Authenticated successfully",
        "user": current_user,
    }