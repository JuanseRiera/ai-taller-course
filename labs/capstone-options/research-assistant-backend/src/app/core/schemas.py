from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any

class ResearchRequest(BaseModel):
    question: str = Field(..., description="The research question to investigate.")
    depth: Literal["brief", "detailed", "technical"] = Field("detailed", description="Depth of the research.")
    report_format: Literal["essay", "bullet_points", "table"] = Field("essay", description="Format of the final report.")
    max_iterations: int = Field(5, ge=1, le=20, description="Maximum number of agent iterations.")

class ResearchResponse(BaseModel):
    final_report: str
    status: Literal["complete", "draft"]
    metadata: Dict[str, Any]
    logs: List[Dict[str, Any]]
