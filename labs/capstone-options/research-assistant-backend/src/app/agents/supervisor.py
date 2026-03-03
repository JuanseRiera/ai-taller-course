from autogen import AssistantAgent
from typing import Dict, Any

class SupervisorAgent(AssistantAgent):
    """
    Agent responsible for high-level planning, decomposition, and final synthesis.
    """

    DEFAULT_SYSTEM_PROMPT = """You are the Supervisor.
    Your role is to orchestrate the research process and ensure the final output meets the user's request.
    
    Responsibilities:
    1. Analyze the User's Request: Break down the complex question into manageable sub-tasks for the Researcher.
    2. Guide the Workflow: Ensure the Researcher gathers info, the Writer drafts it, and the Reviewer checks it.
    3. Final Synthesis: Once the Reviewer approves, compile the final report into a structured JSON object.
    
    Output Format for Final Step:
    Strictly output valid JSON with the following schema:
    {
      "final_report": "The complete text of the report...",
      "metadata": {
        "depth": "...",
        "format": "...",
        "sources": ["..."]
      }
    }
    """

    def __init__(self, name: str, llm_config: Dict[str, Any], **kwargs):
        super().__init__(
            name=name,
            system_message=self.DEFAULT_SYSTEM_PROMPT,
            llm_config=llm_config,
            **kwargs
        )
