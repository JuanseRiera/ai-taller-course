import pytest
from httpx import ASGITransport, AsyncClient

from src.app.main import app
import src.app.main as main_module


async def get_client(timeout: float = 150.0) -> AsyncClient:
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://testserver", timeout=timeout)


class BrokenOrchestrator:
    def __init__(self, request):
        raise RuntimeError("startup failure")


@pytest.mark.asyncio
async def test_health_endpoint_returns_ok():
    client = await get_client()
    async with client as session:
        response = await session.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_research_endpoint_handles_orchestrator_errors(monkeypatch):
    monkeypatch.setattr(main_module, "ResearchOrchestrator", BrokenOrchestrator)

    payload = {
        "question": "What is the capital of Australia?",
        "depth": "brief",
        "report_format": "essay",
        "max_iterations": 2,
        "timeout": 60,
    }

    client = await get_client()
    async with client as session:
        response = await session.post("/research", json=payload)

    assert response.status_code == 500
    assert "startup failure" in response.text
