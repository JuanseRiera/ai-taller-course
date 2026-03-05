import asyncio
import json
from types import SimpleNamespace

import pytest

import src.app.core.orchestrator as orchestrator_module
from src.app.core.schemas import ResearchRequest
from tests.conftest import FakeAgent, FakeGroupChat, FakeGroupChatManager, build_orchestrator


class TimeoutUserProxy:
    def __init__(self, name, system_message, code_execution_config, human_input_mode):
        self.name = name

    async def a_initiate_chat(self, manager, message):
        await asyncio.sleep(10)


class ErrorUserProxy:
    def __init__(self, name, system_message, code_execution_config, human_input_mode):
        self.name = name

    async def a_initiate_chat(self, manager, message):
        raise RuntimeError("chat boom")


class ReadyUserProxy:
    def __init__(self, name, system_message, code_execution_config, human_input_mode):
        self.name = name

    async def a_initiate_chat(self, manager, message):
        manager.groupchat.messages.append({"name": "Writer", "role": "assistant", "content": "Draft"})
        final_payload = {
            "final_report": "Ready report",
            "status": "complete",
            "metadata": {"depth": "brief", "format": "essay"},
        }
        manager.groupchat.messages.append({
            "name": "Supervisor",
            "role": "assistant",
            "content": json.dumps(final_payload),
        })


class DummyGroupChat:
    def __init__(self, agents, messages, max_round, speaker_selection_method):
        self.agents = agents
        self.messages = messages
        self.max_round = max_round
        self.speaker_selection_method = speaker_selection_method


@pytest.mark.asyncio
async def test_run_research_timeout_triggers_salvage(monkeypatch):
    agents = {
        "supervisor": FakeAgent(
            "Supervisor",
            reply='{"final_report":"salvaged","status":"draft","metadata":{}}',
        ),
        "researcher": FakeAgent("Researcher"),
        "writer": FakeAgent("Writer"),
        "reviewer": FakeAgent("Reviewer"),
    }
    request = SimpleNamespace(
        question="q",
        depth="brief",
        report_format="essay",
        max_iterations=3,
        timeout=0.01,
    )
    orch = build_orchestrator(request=request, agents_dict=agents)

    monkeypatch.setattr(orchestrator_module, "UserProxyAgent", TimeoutUserProxy)
    monkeypatch.setattr(orchestrator_module, "GroupChat", FakeGroupChat)
    monkeypatch.setattr(orchestrator_module, "GroupChatManager", FakeGroupChatManager)

    chunks = []
    async for chunk in orch.run_research():
        chunks.append(chunk)

    payloads = [c for c in chunks if c.startswith("data:")]
    result_payload = json.loads(payloads[-1].replace("data:", "").strip())

    assert result_payload["type"] == "result"
    assert result_payload["data"]["status"] == "draft"
    history_text = str(result_payload["data"]["conversation_history"])
    assert "Session timeout reached" in history_text


@pytest.mark.asyncio
async def test_run_research_task_exception_yields_error_event(monkeypatch):
    agents = {
        "supervisor": FakeAgent("Supervisor"),
        "researcher": FakeAgent("Researcher"),
        "writer": FakeAgent("Writer"),
        "reviewer": FakeAgent("Reviewer"),
    }
    request = SimpleNamespace(
        question="q",
        depth="brief",
        report_format="essay",
        max_iterations=3,
        timeout=1,
    )
    orch = build_orchestrator(request=request, agents_dict=agents)

    monkeypatch.setattr(orchestrator_module, "UserProxyAgent", ErrorUserProxy)
    monkeypatch.setattr(orchestrator_module, "GroupChat", FakeGroupChat)
    monkeypatch.setattr(orchestrator_module, "GroupChatManager", FakeGroupChatManager)

    chunks = []
    async for chunk in orch.run_research():
        chunks.append(chunk)

    error_events = [c for c in chunks if '"type": "error"' in c]
    assert error_events, "Expected at least one error event in the stream"


@pytest.mark.asyncio
async def test_run_research_produces_final_result(monkeypatch):
    agents = {
        "supervisor": FakeAgent("Supervisor"),
        "researcher": FakeAgent("Researcher"),
        "writer": FakeAgent("Writer"),
        "reviewer": FakeAgent("Reviewer"),
    }

    def fake_get_config():
        return {"config_list": [{"model": "test-model"}], "temperature": 0.7, "timeout": 10}

    monkeypatch.setattr(orchestrator_module.Config, "get_gemini_config", fake_get_config)
    monkeypatch.setattr(orchestrator_module.AgentFactory, "create_agents", lambda *args, **kwargs: agents)
    monkeypatch.setattr(orchestrator_module, "GroupChat", DummyGroupChat)
    monkeypatch.setattr(orchestrator_module, "GroupChatManager", FakeGroupChatManager)
    monkeypatch.setattr(orchestrator_module, "UserProxyAgent", ReadyUserProxy)

    request = ResearchRequest(
        question="Explain tests",
        depth="brief",
        report_format="essay",
        max_iterations=2,
        timeout=30,
    )
    orch = orchestrator_module.ResearchOrchestrator(request)

    chunks = []
    async for chunk in orch.run_research():
        chunks.append(chunk)

    result_chunks = [c for c in chunks if '"type": "result"' in c]
    assert result_chunks
    payload = json.loads(result_chunks[-1].replace("data:", "").strip())
    assert payload["data"]["final_report"] == "Ready report"
    assert payload["data"]["status"] == "complete"
    assert payload["data"]["metadata"]["model"] == "test-model"
    assert len(payload["data"]["conversation_history"]) >= 2
