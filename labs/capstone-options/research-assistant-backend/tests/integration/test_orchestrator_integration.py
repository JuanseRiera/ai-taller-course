import asyncio
import json
from types import SimpleNamespace

import pytest

import src.app.core.orchestrator as orchestrator_module
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
