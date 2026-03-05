from types import SimpleNamespace

from tests.conftest import FakeGroupChat, build_orchestrator


def test_state_transition_user_routes_to_supervisor(orchestrator):
    groupchat = FakeGroupChat(agents=[], messages=[{"name": "User", "content": "hi"}], max_round=5, speaker_selection_method=None)
    last_speaker = SimpleNamespace(name="User")

    next_agent = orchestrator._state_transition(last_speaker, groupchat)
    assert next_agent.name == "Supervisor"


def test_state_transition_parses_plan_and_routes_first_agent(orchestrator):
    groupchat = FakeGroupChat(
        agents=[],
        messages=[{"name": "Supervisor", "content": "PLAN: Researcher -> Writer -> Reviewer"}],
        max_round=5,
        speaker_selection_method=None,
    )
    last_speaker = SimpleNamespace(name="Supervisor")

    next_agent = orchestrator._state_transition(last_speaker, groupchat)

    assert next_agent.name == "Researcher"
    assert [a.name for a in orchestrator.current_plan] == ["Researcher", "Writer", "Reviewer"]
    assert orchestrator.plan_index == 0


def test_state_transition_approve_interrupts_plan(orchestrator):
    orchestrator.current_plan = [
        orchestrator.agents_dict["researcher"],
        orchestrator.agents_dict["writer"],
    ]
    orchestrator.plan_index = 1
    groupchat = FakeGroupChat(
        agents=[],
        messages=[{"name": "Reviewer", "content": "APPROVE"}],
        max_round=5,
        speaker_selection_method=None,
    )
    last_speaker = SimpleNamespace(name="Reviewer")

    next_agent = orchestrator._state_transition(last_speaker, groupchat)

    assert next_agent.name == "Supervisor"
    assert orchestrator.current_plan == []
    assert orchestrator.plan_index == -1


def test_state_transition_retry_then_escalate(orchestrator):
    groupchat = FakeGroupChat(
        agents=[],
        messages=[{"name": "Researcher", "content": "I don't know"}],
        max_round=5,
        speaker_selection_method=None,
    )
    last_speaker = orchestrator.agents_dict["researcher"]

    first = orchestrator._state_transition(last_speaker, groupchat)
    assert first.name == "Researcher"
    assert orchestrator.retry_tracker.get("Researcher") == 1
    assert groupchat.messages[-1]["name"] == "System"

    # Same failure again should escalate
    groupchat.messages[-1] = {"name": "Researcher", "content": "I don't know"}
    second = orchestrator._state_transition(last_speaker, groupchat)
    assert second.name == "Supervisor"
    assert orchestrator.retry_tracker.get("Researcher") == 0


def test_state_transition_supervisor_json_terminates(orchestrator):
    groupchat = FakeGroupChat(
        agents=[],
        messages=[{"name": "Supervisor", "content": '{"final_report":"ok","status":"complete"}'}],
        max_round=5,
        speaker_selection_method=None,
    )
    last_speaker = SimpleNamespace(name="Supervisor")

    next_agent = orchestrator._state_transition(last_speaker, groupchat)
    assert next_agent is None


def test_state_transition_invalid_plan_falls_back(orchestrator):
    groupchat = FakeGroupChat(
        agents=[],
        messages=[{"name": "Supervisor", "content": "PLAN: Ghost -> Phantom"}],
        max_round=5,
        speaker_selection_method=None,
    )
    last_speaker = SimpleNamespace(name="Supervisor")

    next_agent = orchestrator._state_transition(last_speaker, groupchat)

    assert next_agent.name == "Supervisor"
    assert orchestrator.current_plan == []
    assert orchestrator.plan_index == -1


def test_state_transition_returns_none_when_no_iterations_left(orchestrator):
    orchestrator.request.max_iterations = 1
    groupchat = FakeGroupChat(
        agents=[],
        messages=[{"name": "Researcher", "content": "Some work"}],
        max_round=5,
        speaker_selection_method=None,
    )
    last_speaker = SimpleNamespace(name="Supervisor")

    next_agent = orchestrator._state_transition(last_speaker, groupchat)

    assert next_agent is None


def test_state_transition_enqueues_progress_event(orchestrator):
    long_content = "x" * 60
    groupchat = FakeGroupChat(
        agents=[],
        messages=[{"name": "Writer", "content": long_content}],
        max_round=5,
        speaker_selection_method=None,
    )
    last_speaker = SimpleNamespace(name="Writer")

    orchestrator.message_queue = build_orchestrator().message_queue
    orchestrator._state_transition(last_speaker, groupchat)

    progress = orchestrator.message_queue.get_nowait()
    assert progress["type"] == "progress"
    assert "Writer has completed" in progress["message"]
