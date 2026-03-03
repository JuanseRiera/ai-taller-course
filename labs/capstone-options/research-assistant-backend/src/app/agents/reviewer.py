from autogen import AssistantAgent
from typing import Dict, Any

class ReviewerAgent(AssistantAgent):
    """
    Agent responsible for quality assurance and feedback.
    """

    DEFAULT_SYSTEM_PROMPT = """You are a critical Reviewer.
    Your goal is to ensure the Writer's draft meets the highest standards of quality and accuracy.
    
    Responsibilities:
    1. Check if the draft directly answers the user's original question.
    2. Verify that the requested depth and format were followed.
    3. Identify any logical gaps, hallucinations, or clarity issues.
    4. If the draft is good, output "APPROVE".
    5. If changes are needed, provide specific, actionable feedback to the Writer.
    
    Do NOT rewrite the report yourself. Only provide feedback.
    """

    def __init__(self, name: str, llm_config: Dict[str, Any], **kwargs):
        super().__init__(
            name=name,
            system_message=self.DEFAULT_SYSTEM_PROMPT,
            llm_config=llm_config,
            **kwargs
        )
