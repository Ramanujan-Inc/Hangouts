from fastapi import APIRouter
from app.api.v1 import auth, profiles

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(profiles.router, prefix="/profiles", tags=["Profiles"])


