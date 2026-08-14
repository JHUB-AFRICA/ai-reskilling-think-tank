"""
test_rate_limit.py

Tests app_api/rate_limit.py's in-memory daily limit and response cache
logic. No network or real time-of-day dependency beyond time.time()
itself.

Run with: pytest tests/test_rate_limit.py -v
"""

from __future__ import annotations

import time

import pytest

# pyrefly: ignore [missing-import]
from app_api import rate_limit as rl


@pytest.fixture(autouse=True)
def clear_state():
    """Each test gets a clean slate -- these module-level dicts would
    otherwise leak state between tests, since they're deliberately
    process-global (see the module's documented single-instance
    limitation)."""
    rl._daily_call_log.clear()
    rl._response_cache.clear()
    yield
    rl._daily_call_log.clear()
    rl._response_cache.clear()


class TestDailyLimit:
    def test_allows_calls_under_the_limit(self):
        for _ in range(rl.DAILY_LIMIT):
            assert rl.check_and_record_daily_limit("user-1") is True

    def test_blocks_calls_over_the_limit(self):
        for _ in range(rl.DAILY_LIMIT):
            rl.check_and_record_daily_limit("user-1")
        assert rl.check_and_record_daily_limit("user-1") is False

    def test_rejected_call_is_not_recorded(self):
        for _ in range(rl.DAILY_LIMIT):
            rl.check_and_record_daily_limit("user-1")
        rl.check_and_record_daily_limit("user-1")  # rejected, 6th attempt
        assert len(rl._daily_call_log["user-1"]) == rl.DAILY_LIMIT

    def test_limits_are_independent_per_user(self):
        for _ in range(rl.DAILY_LIMIT):
            rl.check_and_record_daily_limit("user-1")
        assert rl.check_and_record_daily_limit("user-1") is False
        assert rl.check_and_record_daily_limit("user-2") is True

    def test_calls_older_than_24h_are_not_counted(self):
        stale_time = time.time() - 90000  # > 24h ago
        rl._daily_call_log["user-1"] = [stale_time] * rl.DAILY_LIMIT
        assert rl.check_and_record_daily_limit("user-1") is True


_CACHED_VALUE = [
    {"skill_name": "Python", "status": "taxonomy_match", "matched_skill_id": "SKL_001"}
]


class TestResponseCache:
    def test_cache_miss_returns_none(self):
        assert rl.get_cached_response("user-1", "resume text", "goal") is None

    def test_cache_hit_returns_stored_value(self):
        value = _CACHED_VALUE
        rl.set_cached_response("user-1", "resume text", "goal", value)
        assert rl.get_cached_response("user-1", "resume text", "goal") == value

    def test_cache_is_keyed_by_full_request_tuple(self):
        value = _CACHED_VALUE
        rl.set_cached_response("user-1", "resume A", "goal A", value)
        assert rl.get_cached_response("user-1", "resume B", "goal A") is None
        assert rl.get_cached_response("user-2", "resume A", "goal A") is None

    def test_expired_cache_entry_returns_none(self):
        value = _CACHED_VALUE
        key = rl._cache_key("user-1", "resume text", "goal")
        rl._response_cache[key] = (time.time() - rl.CACHE_TTL_SECONDS - 1, value)
        assert rl.get_cached_response("user-1", "resume text", "goal") is None
