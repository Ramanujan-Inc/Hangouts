from fastapi import APIRouter
from app.api.v1 import auth, profiles, groups, hangouts, media, memories, notes, expenses, storage

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(profiles.router, prefix="/profiles", tags=["Profiles"])
api_router.include_router(groups.router, prefix="/groups", tags=["Groups"])
api_router.include_router(hangouts.router, prefix="/hangouts", tags=["Hangouts"])
api_router.include_router(media.router, tags=["Media"])
api_router.include_router(memories.router, prefix="/memories", tags=["Memories"])
api_router.include_router(notes.router, tags=["Notes"])
api_router.include_router(expenses.router, tags=["Expenses"])
api_router.include_router(storage.router, prefix="/storage", tags=["Storage"])




