from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List, Literal

class ResearchRequest(BaseModel):
    question: str
    depth: Literal["brief", "detailed", "technical"] = "detailed"
    max_iterations: int = Field(default=5, ge=1, le=20)
    report_format: Literal["essay", "bullet_points", "table"] = "essay"
    timeout: int = Field(default=300, ge=30, le=1200, description="Session timeout in seconds")

class ResearchResponse(BaseModel):
    final_report: str
    status: Literal["complete", "draft"]
    metadata: Dict[str, Any]
    logs: List[Dict[str, Any]]
