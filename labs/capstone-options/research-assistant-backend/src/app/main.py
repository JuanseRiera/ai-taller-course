from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from .core.schemas import ResearchRequest
from .core.orchestrator import ResearchOrchestrator
import uvicorn
import os

app = FastAPI(title="Research Assistant API", version="1.0.0")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from .utils.logger import get_logger

logger = get_logger(__name__)

@app.post("/research")
async def research(request: ResearchRequest):
    """
    Starts a research session with orchestrated agents.
    Returns a stream of agent interactions and the final report.
    """
    logger.info(f"Received research request: {request.question[:50]}... (Timeout: {request.timeout}s)")
    try:
        orchestrator = ResearchOrchestrator(request)
        
        return StreamingResponse(
            orchestrator.run_research(),
            media_type="text/event-stream"
        )
    except Exception as e:
        logger.error(f"Failed to start research: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("src.app.main:app", host="0.0.0.0", port=8000, reload=True)
