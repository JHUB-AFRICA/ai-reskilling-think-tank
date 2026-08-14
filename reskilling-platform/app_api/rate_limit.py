"""
rate_limit.py

In-memory rate limiting and response caching for the Gemini-backed
career reasoning endpoint (NFR-03: max 5 LLM calls per user per day,
response caching for repeated identical requests).

LIMITATION, stated plainly: this is process-local in-memory state. It
is correct for a single-instance deployment -- which is what Phase D
targets -- but would silently under-count/over-allow across multiple
server instances, and resets on every restart. Scaling to multiple
instances requires moving this state to Redis or the Postgres database
already introduced in Phase C. Deferred deliberately: there is exactly
one FastAPI process today, and introducing Redis before there is a
second instance to coordinate would be complexity with no present
payoff -- the same "don't build ahead of an actual need" principle
applied throughout this project's phased roadmap.
"""

from __future__ import annotations

import hashlib
import time
from collections import defaultdict

DAILY_LIMIT = 5
CACHE_TTL_SECONDS = 3600

_daily_call_log: dict[str, list[float]] = defaultdict(list)
_response_cache: dict[str, tuple[float, list[dict]]] = {}


def _cache_key(user_id: str, resume_text: str, career_goal: str) -> str:
    raw = f"{user_id}:{resume_text}:{career_goal}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def check_and_record_daily_limit(user_id: str) -> bool:
    """Returns True and records this call if the user is under today's
    limit. Returns False (call NOT recorded) if the limit is already
    reached, so a rejected call never itself counts against the user."""
    now = time.time()
    one_day_ago = now - 86400

    calls = [t for t in _daily_call_log[user_id] if t > one_day_ago]

    if len(calls) >= DAILY_LIMIT:
        _daily_call_log[user_id] = calls
        return False

    calls.append(now)
    _daily_call_log[user_id] = calls
    return True


def get_cached_response(user_id: str, resume_text: str, career_goal: str) -> list[dict] | None:
    key = _cache_key(user_id, resume_text, career_goal)
    entry = _response_cache.get(key)
    if not entry:
        return None
    cached_at, value = entry
    if time.time() - cached_at > CACHE_TTL_SECONDS:
        del _response_cache[key]
        return None
    return value


def set_cached_response(
    user_id: str, resume_text: str, career_goal: str, value: list[dict]
) -> None:
    key = _cache_key(user_id, resume_text, career_goal)
    _response_cache[key] = (time.time(), value)
