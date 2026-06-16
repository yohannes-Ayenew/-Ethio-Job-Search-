import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
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

# Serve React Frontend
if os.path.isdir("static"):
    if os.path.isdir("static/assets"):
        app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
            
        file_path = os.path.join("static", full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
            
        index_path = os.path.join("static", "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
            
        return {"message": "Frontend not built yet."}
