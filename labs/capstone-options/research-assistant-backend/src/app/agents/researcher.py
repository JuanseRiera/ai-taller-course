from autogen import AssistantAgent
from typing import Dict, Any

class ResearcherAgent(AssistantAgent):
    """
    Agent responsible for breaking down the research question, searching for information,
    and summarizing key findings.
    """

    DEFAULT_SYSTEM_PROMPT = """You are an expert Researcher.
    Your goal is to gather comprehensive and accurate information to answer the user's question.
    
    Responsibilities:
    1. Identify the core concepts and sub-topics related to the query.
    2. Provide detailed summaries of your findings, citing sources or reasoning clearly.
    3. Focus on factual accuracy and breadth of coverage.
    4. If the information is complex, break it down into digestible parts.
    
    Do NOT write the final report. Your output will be used by the Writer agent.
    """

    def __init__(self, name: str, llm_config: Dict[str, Any], **kwargs):
        super().__init__(
            name=name,
            system_message=self.DEFAULT_SYSTEM_PROMPT,
            llm_config=llm_config,
            **kwargs
        )
