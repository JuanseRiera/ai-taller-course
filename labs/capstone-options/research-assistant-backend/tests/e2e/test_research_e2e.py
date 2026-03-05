import json
import os

import pytest
from httpx import ASGITransport, AsyncClient

from src.app.main import app


RUN_E2E = os.getenv("RUN_E2E") == "1" and bool(os.getenv("GOOGLE_API_KEY"))
pytestmark = pytest.mark.skipif(
    not RUN_E2E,
    reason="Set RUN_E2E=1 and GOOGLE_API_KEY to run live E2E tests.",
)


async def get_client(timeout: float = 150.0) -> AsyncClient:
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://testserver", timeout=timeout)


async def parse_sse_stream(response) -> list[dict]:
    messages = []
    async for line in response.aiter_lines():
        if not line.startswith("data:"):
            continue
        payload = line[len("data:") :].strip()
        if payload == "[DONE]":
            break
        try:
            messages.append(json.loads(payload))
        except json.JSONDecodeError:
            continue
    return messages


@pytest.mark.e2e
@pytest.mark.asyncio
async def test_e2e_successful_research_flow():
    payload = {
        "question": "What is the capital of France? Reply in one sentence.",
        "depth": "brief",
        "report_format": "essay",
        "max_iterations": 3,
        "timeout": 120,
    }

    client = await get_client()
    async with client as session:
        response = await session.post("/research", json=payload)
        messages = await parse_sse_stream(response)
        await response.aclose()

    assert response.status_code == 200
    assert messages

    result = next((m for m in messages if m.get("type") == "result"), None)
    assert result is not None
    assert result["data"]["status"] in ["complete", "draft"]
    assert "Paris" in result["data"]["final_report"]
    assert len(result["data"]["conversation_history"]) >= 3


@pytest.mark.e2e
@pytest.mark.asyncio
async def test_e2e_invalid_request_returns_422():
    payload = {
        "question": "x",
        "depth": "invalid",
        "max_iterations": 0,
        "report_format": "essay",
    }

    client = await get_client(timeout=20.0)
    async with client as session:
        response = await session.post("/research", json=payload)
        messages = await parse_sse_stream(response)
        await response.aclose()

    assert response.status_code == 422
    assert "Input should be 'brief', 'detailed' or 'technical'" in response.text
    assert "greater than or equal to 1" in response.text


@pytest.mark.e2e
@pytest.mark.asyncio
async def test_e2e_session_timeout_salvage_mode():
    request_payload = {
        "question": "Write a massive, 10-page detailed history of the Roman Empire.",
        "depth": "detailed",
        "report_format": "essay",
        "max_iterations": 10,
        "timeout": 30,
    }

    client = await get_client(timeout=20.0)
    async with client as session:
        response = await session.post("/research", json=request_payload)
        messages = await parse_sse_stream(response)
        await response.aclose()

    assert response.status_code == 200

    final_result = None
    for msg in messages:
        if msg.get("type") == "result":
            final_result = msg
            break

    assert final_result is not None
    assert final_result["data"]["status"] == "draft"
    history_text = str(final_result["data"]["conversation_history"])
    assert "Session timeout reached" in history_text
