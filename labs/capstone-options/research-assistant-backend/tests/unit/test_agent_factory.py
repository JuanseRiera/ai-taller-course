from src.app.agents import factory as factory_module
from src.app.agents.factory import AgentFactory


class DummyAgent:
    def __init__(self, name, llm_config, **kwargs):
        self.name = name
        self.llm_config = llm_config
        self.kwargs = kwargs


class DummyWriter(DummyAgent):
    pass


def test_create_agents_forwards_depth_and_format(monkeypatch):
    monkeypatch.setattr(factory_module, "SupervisorAgent", DummyAgent)
    monkeypatch.setattr(factory_module, "ResearcherAgent", DummyAgent)
    monkeypatch.setattr(factory_module, "WriterAgent", DummyWriter)
    monkeypatch.setattr(factory_module, "ReviewerAgent", DummyAgent)

    llm_config = {"config_list": [{"model": "test"}]}
    agents = AgentFactory.create_agents(llm_config=llm_config, depth="brief", report_format="table")

    assert set(agents.keys()) == {"supervisor", "researcher", "writer", "reviewer"}
    writer = agents["writer"]
    assert writer.kwargs["depth"] == "brief"
    assert writer.kwargs["report_format"] == "table"
    assert writer.llm_config is llm_config

    for key in ("supervisor", "researcher", "reviewer"):
        assert agents[key].kwargs == {}
