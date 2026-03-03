from typing import Dict, Any, List
from .researcher import ResearcherAgent
from .writer import WriterAgent
from .reviewer import ReviewerAgent
from .supervisor import SupervisorAgent

class AgentFactory:
    """
    Factory class to create and configure research agents.
    """
    
    @staticmethod
    def create_agents(llm_config: Dict[str, Any], depth: str, report_format: str) -> Dict[str, Any]:
        """
        Creates instances of Researcher, Writer, Reviewer, and Supervisor.
        Injects specific prompts based on depth/format.
        """
        
        # 1. Supervisor (Orchestrator/Planner)
        supervisor = SupervisorAgent(
            name="Supervisor",
            llm_config=llm_config
        )

        # 2. Researcher (Gathering)
        researcher = ResearcherAgent(
            name="Researcher",
            llm_config=llm_config
        )

        # 3. Writer (Drafting - needs custom prompt for depth/format)
        # Note: We need to modify WriterAgent to accept these params in its constructor or system prompt
        writer = WriterAgent(
            name="Writer",
            llm_config=llm_config,
            depth=depth,
            report_format=report_format
        )

        # 4. Reviewer (QA)
        reviewer = ReviewerAgent(
            name="Reviewer",
            llm_config=llm_config
        )

        return {
            "supervisor": supervisor,
            "researcher": researcher,
            "writer": writer,
            "reviewer": reviewer
        }
