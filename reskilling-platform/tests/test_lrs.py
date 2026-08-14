"""
test_lrs.py

Verifies xAPI statement shape, not network/file I/O behavior beyond a
local temp path. Run with: pytest tests/test_lrs.py -v
"""

from __future__ import annotations

import json

import pytest

from reskilling.lrs import build_statement, log_gap_analysis_event


class TestBuildStatement:
    def test_unknown_verb_raises(self):
        with pytest.raises(ValueError):
            build_statement("a@b.com", "not_a_real_verb", "x", "X")

    def test_actor_uses_mailto_iri(self):
        stmt = build_statement("a@b.com", "experienced", "x", "X")
        assert stmt["actor"]["mbox"] == "mailto:a@b.com"

    def test_object_id_is_namespaced(self):
        stmt = build_statement("a@b.com", "experienced", "resume-upload", "Resume upload")
        assert stmt["object"]["id"].endswith("/activities/resume-upload")

    def test_result_extensions_are_namespaced(self):
        stmt = build_statement(
            "a@b.com", "assessed", "x", "X", result_extensions={"readiness_score": 58.1}
        )
        ext_keys = list(stmt["result"]["extensions"].keys())
        assert len(ext_keys) == 1
        assert ext_keys[0].endswith("/extensions/readiness_score")
        assert stmt["result"]["extensions"][ext_keys[0]] == 58.1

    def test_no_result_key_when_no_extensions_given(self):
        stmt = build_statement("a@b.com", "experienced", "x", "X")
        assert "result" not in stmt

    def test_timestamp_is_iso8601_utc(self):
        stmt = build_statement("a@b.com", "experienced", "x", "X")
        assert stmt["timestamp"].endswith("Z")


class TestLogGapAnalysisEvent:
    def test_writes_valid_jsonl_line(self, tmp_path):
        log_path = tmp_path / "statements.jsonl"
        summary = {
            "occupation_title": "Data Analyst",
            "readiness_score": 58.1,
            "matched_count": 2,
            "missing_count": 2,
            "top_gaps": ["Critical Thinking"],
        }
        log_gap_analysis_event("a@b.com", summary, log_path=log_path)

        lines = log_path.read_text().strip().split("\n")
        assert len(lines) == 1
        parsed = json.loads(lines[0])
        assert parsed["verb"]["id"] == "https://w3id.org/xapi/dod-isd/verbs/assessed"

    def test_appends_not_overwrites(self, tmp_path):
        log_path = tmp_path / "statements.jsonl"
        summary = {
            "occupation_title": "Data Analyst", "readiness_score": 50.0,
            "matched_count": 1, "missing_count": 1, "top_gaps": [],
        }
        log_gap_analysis_event("a@b.com", summary, log_path=log_path)
        log_gap_analysis_event("a@b.com", summary, log_path=log_path)

        lines = log_path.read_text().strip().split("\n")
        assert len(lines) == 2
