from autogen import AssistantAgent
from typing import Dict, Any

class WriterAgent(AssistantAgent):
    """
    Agent responsible for synthesizing research findings into a structured report.
    """

    BASE_SYSTEM_PROMPT = """You are an expert Writer.
    Your goal is to take the raw information provided by the Researcher and craft a high-quality report.
    
    Format Requirements:
    - Depth: {depth}
    - Format: {report_format}
    
    Responsibilities:
    1. Structure the content logically (Introduction, Body, Conclusion).
    2. Ensure the tone is appropriate for the requested depth (e.g., technical vs. brief).
    3. Synthesize multiple pieces of information into a cohesive narrative.
    4. Incorporate feedback from the Reviewer if revisions are requested.
    
    Do NOT fabricate information. Use only what has been provided or is general knowledge.
    """

    def __init__(self, name: str, llm_config: Dict[str, Any], depth: str = "detailed", report_format: str = "essay", **kwargs):
        system_message = self.BASE_SYSTEM_PROMPT.format(depth=depth, report_format=report_format)
        super().__init__(
            name=name,
            system_message=system_message,
            llm_config=llm_config,
            **kwargs
        )
