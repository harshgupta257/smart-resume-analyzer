# main.py
# FastAPI application entry point

import sys
import os
from contextlib import asynccontextmanager
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import nltk

from analyzer import analyze_resume

# Download NLTK data at startup (needed on cloud servers)
def ensure_nltk_data():
    for pkg in ["punkt", "stopwords", "punkt_tab"]:
        try:
            nltk.download(pkg, quiet=True)
        except Exception:
            pass

ensure_nltk_data()

app = FastAPI(
    title="Smart Resume Analyzer API",
    description="Analyze a resume PDF against a job description using NLP and keyword matching.",
    version="1.0.0",
)

# ─── CORS ────────────────────────────────────────────────────────────────────
# Allow frontend (file:// or localhost) to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── ROUTES ──────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "message": "Smart Resume Analyzer API is running!",
        "version": "1.0.0",
        "endpoints": {
            "analyze": "POST /analyze",
            "health": "GET /health",
        }
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Smart Resume Analyzer"}


@app.post("/analyze")
async def analyze(
    resume: UploadFile = File(..., description="Resume PDF file"),
    job_description: str = Form(..., description="Job description text"),
):
    """
    Analyze a resume PDF against a job description.

    - **resume**: PDF file of the resume
    - **job_description**: Full text of the job description
    """
    # Validate file type
    if not resume.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported. Please upload a .pdf file."
        )

    # Validate job description
    job_description = job_description.strip()
    if len(job_description) < 50:
        raise HTTPException(
            status_code=400,
            detail="Job description is too short. Please provide a complete job description (at least 50 characters)."
        )

    # Read file bytes
    try:
        file_bytes = await resume.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read uploaded file: {str(e)}")

    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Run analysis
    try:
        result = analyze_resume(file_bytes, job_description)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

    return JSONResponse(content=result)


# ─── ENTRY POINT ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = "0.0.0.0"  # Required for cloud platforms (Render, Railway, etc.)
    is_dev = os.environ.get("ENVIRONMENT", "production") == "development"
    print(f"Starting Smart Resume Analyzer API on {host}:{port}")
    print(f"API docs: http://127.0.0.1:{port}/docs")
    uvicorn.run("main:app", host=host, port=port, reload=is_dev)
