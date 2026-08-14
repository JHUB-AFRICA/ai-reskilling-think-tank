"""
api_client.py

Thin HTTP client used by the Streamlit app to call the FastAPI service
(app_api/main.py) instead of importing src/reskilling/ functions
directly. This is the deliberate validation step for Phase A: if the
API is a truly faithful wrapper over the tested core, the Streamlit UI
should behave identically whether it calls Python functions in-process
or goes over HTTP to a separate service.

Uses `requests` (synchronous) since Streamlit reruns its script
top-to-bottom per interaction rather than running an async event loop
-- there is no benefit to an async HTTP client here.

Note on statelessness: /analyze-gap re-extracts skills from resume_text
server-side rather than accepting a previously-extracted skill list.
This is deliberate -- a stateless REST endpoint should not depend on
another request's in-memory result. The minor cost is that extraction
runs twice (once for display on the Upload page, once inside gap
analysis on the Pathway page); this is an acceptable, explicit trade
for a genuinely stateless API contract.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field

import requests

from reskilling.schemas import SkillMatch

API_BASE_URL = os.environ.get("RESKILLING_API_URL", "http://localhost:8000")
TIMEOUT_SECONDS = 30


@dataclass
class SkillGapView:
    """Client-side mirror of recommender.SkillGap, reconstructed from
    the API's JSON response rather than imported directly -- the
    Streamlit app should depend only on the API contract, not on
    recommender.py's internal dataclasses, now that the API is the
    source of truth for this data."""

    skill_id: str
    skill_name: str
    domain: str
    importance: float


@dataclass
class GapAnalysisView:
    occupation_title: str
    readiness_score: float
    matched_skills: list[SkillMatch] = field(default_factory=list)
    missing_skills: list[SkillGapView] = field(default_factory=list)


def _get(path: str, **kwargs) -> dict:
    resp = requests.get(f"{API_BASE_URL}{path}", timeout=TIMEOUT_SECONDS, **kwargs)
    resp.raise_for_status()
    return resp.json()


def _post(path: str, json_body: dict) -> dict:
    resp = requests.post(f"{API_BASE_URL}{path}", json=json_body, timeout=TIMEOUT_SECONDS)
    if resp.status_code == 404:
        raise ValueError(resp.json().get("detail", "Not found"))
    resp.raise_for_status()
    return resp.json()


def health_check() -> bool:
    try:
        return _get("/health").get("status") == "ok"
    except requests.RequestException:
        return False


def list_occupations() -> list[str]:
    return _get("/occupations")["occupations"]


def extract_skills(resume_text: str) -> list[SkillMatch]:
    data = _post("/extract-skills", {"resume_text": resume_text})
    return [SkillMatch(**s) for s in data["skills"]]


def analyze_gap(resume_text: str, target_occupation: str, actor_email: str) -> GapAnalysisView:
    data = _post(
        "/analyze-gap",
        {
            "resume_text": resume_text,
            "target_occupation": target_occupation,
            "actor_email": actor_email,
        },
    )
    return GapAnalysisView(
        occupation_title=data["occupation_title"],
        readiness_score=data["readiness_score"],
        matched_skills=[SkillMatch(**s) for s in data["matched_skills"]],
        missing_skills=[SkillGapView(**g) for g in data["missing_skills"]],
    )


def get_lrs_statements(limit: int = 50) -> list[dict]:
    return _get("/lrs/statements", params={"limit": limit})["statements"]


def get_taxonomy_stats() -> dict:
    return _get("/taxonomy/stats")


def get_requirements_for(occupation: str) -> list[dict]:
    return _get("/taxonomy/requirements", params={"occupation": occupation})["requirements"]


def get_skills_resources(skills: list[dict]) -> dict:
    """skills is a list of {"skill_id": ..., "skill_name": ...} dicts.
    Returns {skill_id: [resource_dict, ...]}. Public endpoint, no auth
    -- see src/reskilling/resources.py for the curated-vs-search trust
    distinction each resource_dict carries via its "tier" field."""
    return _post("/skills/resources", {"skills": skills})["resources"]
