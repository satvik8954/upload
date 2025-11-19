from fastapi import FastAPI
from .routes import upload, analytics
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="SocialSync Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # adjust for production
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(analytics.router)
