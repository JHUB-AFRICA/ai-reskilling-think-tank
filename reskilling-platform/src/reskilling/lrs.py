"""
lrs.py

Minimal xAPI (Experience API) statement builder and Learning Record
Store client for tracking competency-related events on the platform
(skills extracted, gap analysis run, reskilling pathway viewed).

For the MVP, statements are validated for shape and persisted to a
local JSONL file rather than POSTed to a hosted LRS (e.g. Learning
Locker, SCORM Cloud). This keeps the platform demoable with zero
external infrastructure while producing genuinely spec-compliant xAPI
statements -- swapping in a real LRS endpoint later is a one-line change
in `_persist()`, not a rewrite of statement construction.

xAPI statement shape (simplified to what this platform needs):
    {
      "actor": {"mbox": "mailto:user@example.com", "name": "..."},
      "verb": {"id": "http://adlnet.gov/expapi/verbs/...", "display": {"en-US": "..."}},
      "object": {"id": "...", "definition": {"name": {"en-US": "..."}}},
      "result": {"extensions": {...}},   # optional, used for our score data
      "timestamp": "2026-06-30T12:00:00Z"
    }
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

LRS_LOG_PATH = Path("data/processed/xapi_statements.jsonl")

# Standard ADL xAPI verb IDs -- using the canonical registry IDs rather
# than inventing our own, so statements would validate against a real
# LRS without modification.
VERBS = {
    "experienced": {
        "id": "http://adlnet.gov/expapi/verbs/experienced",
        "display": {"en-US": "experienced"},
    },
    "completed": {
        "id": "http://adlnet.gov/expapi/verbs/completed",
        "display": {"en-US": "completed"},
    },
    "assessed": {
        "id": "https://w3id.org/xapi/dod-isd/verbs/assessed",
        "display": {"en-US": "assessed"},
    },
}

PLATFORM_NAMESPACE = "https://reskilling-platform.example.org/activities"


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _build_actor(email: str, name: str | None = None) -> dict:
    actor = {"mbox": f"mailto:{email}", "objectType": "Agent"}
    if name:
        actor["name"] = name
    return actor


def build_statement(
    actor_email: str,
    verb_key: str,
    activity_id: str,
    activity_name: str,
    result_extensions: dict[str, Any] | None = None,
) -> dict:
    """
    Construct a single xAPI statement dict. Does not persist it --
    see log_statement() for that. Kept separate so tests can assert on
    statement shape without touching the filesystem.
    """
    if verb_key not in VERBS:
        raise ValueError(f"Unknown verb_key '{verb_key}'. Valid: {list(VERBS)}")

    statement = {
        "actor": _build_actor(actor_email),
        "verb": VERBS[verb_key],
        "object": {
            "id": f"{PLATFORM_NAMESPACE}/{activity_id}",
            "objectType": "Activity",
            "definition": {"name": {"en-US": activity_name}},
        },
        "timestamp": _now_iso(),
    }
    if result_extensions:
        statement["result"] = {
            "extensions": {
                f"{PLATFORM_NAMESPACE}/extensions/{k}": v
                for k, v in result_extensions.items()
            }
        }
    return statement


def _persist(statement: dict, log_path: Path = LRS_LOG_PATH) -> None:
    """
    Append-only JSONL write -- one statement per line. This is the only
    function that would change if swapping to a hosted LRS: replace the
    file write with `requests.post(lrs_endpoint, json=statement, ...)`.
    Everything else (statement construction, calling code) stays
    identical, which is the point of isolating persistence here.
    """
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with log_path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(statement) + "\n")


def log_gap_analysis_event(
    actor_email: str, gap_summary: dict[str, Any], log_path: Path = LRS_LOG_PATH
) -> dict:
    """
    Convenience wrapper matching recommender.GapAnalysisResult.to_summary_dict()
    shape exactly -- this is the interface boundary that module set up in
    advance. Called from the Streamlit Pathway page after analyze_gap().
    """
    statement = build_statement(
        actor_email=actor_email,
        verb_key="assessed",
        activity_id=f"gap-analysis/{gap_summary['occupation_title'].replace(' ', '-').lower()}",
        activity_name=f"Skills gap analysis: {gap_summary['occupation_title']}",
        result_extensions={
            "readiness_score": gap_summary["readiness_score"],
            "matched_count": gap_summary["matched_count"],
            "missing_count": gap_summary["missing_count"],
            "top_gaps": gap_summary["top_gaps"],
        },
    )
    _persist(statement, log_path)
    logger.info(
        "Logged xAPI statement: %s assessed %s (readiness=%.1f)",
        actor_email,
        gap_summary["occupation_title"],
        gap_summary["readiness_score"],
    )
    return statement


def log_resume_upload_event(actor_email: str, skill_count: int, log_path: Path = LRS_LOG_PATH) -> dict:
    statement = build_statement(
        actor_email=actor_email,
        verb_key="experienced",
        activity_id="resume-upload",
        activity_name="Resume upload and skill extraction",
        result_extensions={"skills_extracted": skill_count},
    )
    _persist(statement, log_path)
    return statement


if __name__ == "__main__":
    sample = log_gap_analysis_event(
        actor_email="demo@example.com",
        gap_summary={
            "occupation_title": "Data Analyst",
            "readiness_score": 58.1,
            "matched_count": 2,
            "missing_count": 2,
            "top_gaps": ["Critical Thinking", "Public Speaking"],
        },
    )
    print(json.dumps(sample, indent=2))
    print(f"\nAppended to: {LRS_LOG_PATH}")
