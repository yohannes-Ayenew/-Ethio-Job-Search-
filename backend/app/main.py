from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import jobs, users, applications, saved_jobs
from app.core.config import settings

app = FastAPI(title="EthioJobs Bot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.MINI_APP_URL, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs.router, prefix="/api/jobs", tags=["Jobs"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(applications.router, prefix="/api/applications", tags=["Applications"])
app.include_router(saved_jobs.router, prefix="/api/users", tags=["Saved Jobs"])

@app.get("/health")
async def health_check():
    return {"status": "ok"}
