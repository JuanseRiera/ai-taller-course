import asyncio
from types import SimpleNamespace

import pytest

from src.app.core.orchestrator import ResearchOrchestrator


class FakeAgent:
    DEFAULT_SYSTEM_PROMPT = "BASE"

    def __init__(self, name: str, reply: str = "", reply_delay: float = 0.0):
        self.name = name
        self._reply = reply
        self._reply_delay = reply_delay
        self.updated_prompts = []

    async def a_generate_reply(self, messages):
        if self._reply_delay:
            await asyncio.sleep(self._reply_delay)
        return self._reply

    def update_system_message(self, message: str):
        self.updated_prompts.append(message)


class FakeGroupChat:
    def __init__(self, agents, messages, max_round, speaker_selection_method):
        self.agents = agents
        self.messages = messages
        self.max_round = max_round
        self.speaker_selection_method = speaker_selection_method


class FakeGroupChatManager:
    def __init__(self, groupchat, llm_config):
        self.groupchat = groupchat
        self.llm_config = llm_config


def build_orchestrator(request=None, agents_dict=None):
    orch = object.__new__(ResearchOrchestrator)
    orch.request = request or SimpleNamespace(
        question="q",
        depth="brief",
        report_format="essay",
        max_iterations=5,
        timeout=1,
    )
    orch.llm_config = {"config_list": [{"model": "test-model"}]}
    orch.agents_dict = agents_dict or {
        "supervisor": FakeAgent("Supervisor"),
        "researcher": FakeAgent("Researcher"),
        "writer": FakeAgent("Writer"),
        "reviewer": FakeAgent("Reviewer"),
    }
    orch.message_queue = asyncio.Queue()
    orch.groupchat = None
    orch.current_plan = []
    orch.plan_index = -1
    orch.retry_tracker = {}
    orch.salvage_mode = False
    orch.last_failure_alert = ""
    return orch


@pytest.fixture
def fake_agents_dict():
    return {
        "supervisor": FakeAgent("Supervisor"),
        "researcher": FakeAgent("Researcher"),
        "writer": FakeAgent("Writer"),
        "reviewer": FakeAgent("Reviewer"),
    }


@pytest.fixture
def orchestrator(fake_agents_dict):
    return build_orchestrator(agents_dict=fake_agents_dict)
