from src.app.utils.logger import get_logger

logger = get_logger(__name__)

try:
    from src.app.agents.researcher import ResearcherAgent
    from src.app.agents.writer import WriterAgent
    from src.app.agents.reviewer import ReviewerAgent
    from src.app.agents.supervisor import SupervisorAgent
    from src.app.agents.factory import AgentFactory
    from src.app.core.orchestrator import ResearchOrchestrator
    from src.app.main import app
    import google.generativeai as genai
    import autogen
    logger.info("All imports successful")
except Exception as e:
    logger.error(f"Import error: {e}")
