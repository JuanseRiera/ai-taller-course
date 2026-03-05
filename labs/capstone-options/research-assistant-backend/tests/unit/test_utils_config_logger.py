import logging

import pytest

from src.app.utils.config import Config
from src.app.utils.logger import get_logger


def test_get_gemini_config_requires_api_key(monkeypatch):
    original_key = Config.GOOGLE_API_KEY
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
    Config.GOOGLE_API_KEY = None

    with pytest.raises(ValueError):
        Config.get_gemini_config()

    Config.GOOGLE_API_KEY = original_key


def test_get_gemini_config_returns_expected_payload(monkeypatch):
    original_key = Config.GOOGLE_API_KEY
    monkeypatch.setenv("GOOGLE_API_KEY", "env-key")
    Config.GOOGLE_API_KEY = "env-key"

    try:
        cfg = Config.get_gemini_config()
        assert cfg["config_list"][0]["api_key"] == "env-key"
        assert cfg["config_list"][0]["model"] == Config.MODEL_NAME
        assert cfg["temperature"] == 0.7
        assert cfg["timeout"] == 120
    finally:
        Config.GOOGLE_API_KEY = original_key


def test_get_logger_returns_same_instance():
    name = "tests.utils.logger"
    logger = get_logger(name)
    assert logger.level == logging.INFO
    assert any(isinstance(handler, logging.StreamHandler) for handler in logger.handlers)
    assert get_logger(name) is logger

    for handler in list(logger.handlers):
        logger.removeHandler(handler)
