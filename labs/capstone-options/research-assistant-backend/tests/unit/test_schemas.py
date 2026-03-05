import pytest
from pydantic import ValidationError

from src.app.core.schemas import ResearchRequest


def test_research_request_accepts_valid_values():
    request = ResearchRequest(
        question="What is testing?",
        depth="brief",
        max_iterations=4,
        report_format="essay",
        timeout=60,
    )

    assert request.depth == "brief"
    assert request.max_iterations == 4
    assert request.report_format == "essay"
    assert request.timeout == 60


@pytest.mark.parametrize("invalid_depth", ["shallow", "DETAILS", "", None])
def test_research_request_rejects_invalid_depth(invalid_depth):
    with pytest.raises(ValidationError):
        ResearchRequest(
            question="Q",
            depth=invalid_depth,
            report_format="essay",
            timeout=60,
        )


def test_research_request_rejects_invalid_iterations():
    with pytest.raises(ValidationError):
        ResearchRequest(
            question="Q",
            depth="brief",
            max_iterations=0,
            report_format="essay",
            timeout=60,
        )


def test_research_request_rejects_invalid_timeout():
    with pytest.raises(ValidationError):
        ResearchRequest(
            question="Q",
            depth="brief",
            max_iterations=3,
            report_format="essay",
            timeout=10,
        )
