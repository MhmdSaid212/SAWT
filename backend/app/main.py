from fastapi import FastAPI
from app.api.auth import router as auth_router
from fastapi import Depends
from app.utils.auth import get_current_user
from app.api.parents import router as parents_router
from app.api.children import router as children_router
from app.api.phonemes import router as phonemes_router
from app.api.exercises import router as exercises_router


app = FastAPI(
    title="SAWT API",
    description="AI-assisted speech therapy companion API",
    version="1.0.0",
)

app.include_router(auth_router)
app.include_router(parents_router)
app.include_router(children_router)
app.include_router(phonemes_router)
app.include_router(exercises_router)

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