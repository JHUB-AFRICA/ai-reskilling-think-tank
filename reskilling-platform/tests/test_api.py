"""
test_api.py

Tests the FastAPI layer using dependency overrides, not real spaCy or
a real taxonomy CSV -- same decoupling principle as test_recommender.py.
A fake extractor and a recommender built from an in-memory synthetic
taxonomy stand in for the real, expensive objects.

Run with: pytest tests/test_api.py -v
"""

from __future__ import annotations

import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app_api.main import app, get_extractor_dep, get_recommender_dep
from reskilling.recommender import ReskillingRecommender
from reskilling.schemas import SkillMatch


class FakeExtractor:
    """Stands in for SkillExtractor -- returns a fixed set of skills
    regardless of input text, so tests don't depend on spaCy or NLP
    correctness (that's covered separately in test recommendations
    for nlp.py, run only in environments with spaCy installed)."""

    def extract(self, text: str) -> list[SkillMatch]:
        if not text.strip():
            return []
        return [
            SkillMatch("SKL_001", "Python", "Technology", "Python", "exact", 1.0),
            SkillMatch("SKL_002", "SQL", "Technology", "SQL", "exact", 1.0),
        ]


@pytest.fixture
def synthetic_taxonomy(tmp_path):
    rows = [
        {
            "skill_id": "SKL_001",
            "skill_name": "Python",
            "cluster": "Python",
            "domain": "Technology",
            "source": "technology",
            "onet_element_id": "T1",
            "onet_soc_code": "15-0000",
            "occupation_title": "Data Analyst",
            "importance": 4.8,
        },
        {
            "skill_id": "SKL_002",
            "skill_name": "SQL",
            "cluster": "SQL",
            "domain": "Technology",
            "source": "technology",
            "onet_element_id": "T2",
            "onet_soc_code": "15-0000",
            "occupation_title": "Data Analyst",
            "importance": 4.5,
        },
        {
            "skill_id": "SKL_003",
            "skill_name": "Critical Thinking",
            "cluster": "Critical Thinking",
            "domain": "Data & Analytics",
            "source": "general",
            "onet_element_id": "G1",
            "onet_soc_code": "15-0000",
            "occupation_title": "Data Analyst",
            "importance": 4.2,
        },
    ]
    path = tmp_path / "synthetic_taxonomy.csv"
    pd.DataFrame(rows).to_csv(path, index=False)
    return path


@pytest.fixture
def client(synthetic_taxonomy):
    app.dependency_overrides[get_extractor_dep] = lambda: FakeExtractor()
    app.dependency_overrides[get_recommender_dep] = lambda: ReskillingRecommender(
        taxonomy_path=synthetic_taxonomy
    )
    yield TestClient(app)
    app.dependency_overrides.clear()


class TestHealth:
    def test_health_ok(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json() == {"status": "ok"}


class TestOccupations:
    def test_lists_synthetic_occupation(self, client):
        resp = client.get("/occupations")
        assert resp.status_code == 200
        assert resp.json() == {"occupations": ["Data Analyst"]}


class TestExtractSkills:
    def test_extracts_fake_skills(self, client):
        resp = client.post(
            "/extract-skills", json={"resume_text": "Python and SQL developer"}
        )
        assert resp.status_code == 200
        skills = resp.json()["skills"]
        assert {s["skill_name"] for s in skills} == {"Python", "SQL"}

    def test_empty_text_rejected_by_validation(self, client):
        resp = client.post("/extract-skills", json={"resume_text": ""})
        assert resp.status_code == 422  # pydantic min_length=1 violation


class TestAnalyzeGap:
    def test_full_gap_analysis_flow(self, client):
        resp = client.post(
            "/analyze-gap",
            json={
                "resume_text": "Python and SQL developer",
                "target_occupation": "Data Analyst",
            },
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["occupation_title"] == "Data Analyst"
        # Python (4.8) + SQL (4.5) matched out of 4.8+4.5+4.2 total = 68.9%
        assert body["readiness_score"] == pytest.approx(68.9, abs=0.1)
        assert len(body["matched_skills"]) == 2
        assert len(body["missing_skills"]) == 1
        assert body["missing_skills"][0]["skill_name"] == "Critical Thinking"

    def test_unknown_occupation_returns_404(self, client):
        resp = client.post(
            "/analyze-gap",
            json={"resume_text": "Python developer", "target_occupation": "Astronaut"},
        )
        assert resp.status_code == 404


class TestLrsStatements:
    def test_logs_and_retrieves_statement(self, client):
        client.post(
            "/analyze-gap",
            json={
                "resume_text": "Python developer",
                "target_occupation": "Data Analyst",
            },
        )
        resp = client.get("/lrs/statements")
        assert resp.status_code == 200
        statements = resp.json()["statements"]
        assert len(statements) >= 1


class TestTaxonomyStats:
    def test_returns_counts_matching_synthetic_taxonomy(self, client):
        resp = client.get("/taxonomy/stats")
        assert resp.status_code == 200
        body = resp.json()
        assert body["occupation_count"] == 1
        assert body["skill_count"] == 3
        assert body["technology_skill_count"] == 2  # Python + SQL are source=technology


class TestTaxonomyRequirements:
    def test_returns_sorted_requirements(self, client):
        resp = client.get(
            "/taxonomy/requirements", params={"occupation": "Data Analyst"}
        )
        assert resp.status_code == 200
        reqs = resp.json()["requirements"]
        importances = [r["importance"] for r in reqs]
        assert importances == sorted(importances, reverse=True)

    def test_unknown_occupation_returns_404(self, client):
        resp = client.get("/taxonomy/requirements", params={"occupation": "Astronaut"})
        assert resp.status_code == 404


class TestCareerGuidance:
    """
    Fully offline: mocks the auth dependency and llm_reasoning.suggest_skills_for_goal
    directly, so this suite requires neither a real Supabase JWT nor a
    live Gemini call, and does not depend on the spaCy model being
    installed (get_extractor_dep is already overridden by the client
    fixture's FakeExtractor).
    """

    @pytest.fixture(autouse=True)
    def clear_rate_limit_state(self):
        import app_api.rate_limit as rl

        rl._daily_call_log.clear()
        rl._response_cache.clear()
        yield
        rl._daily_call_log.clear()
        rl._response_cache.clear()

    @pytest.fixture
    def authed_client(self, client):
        from app_api.auth import CurrentUser, get_current_user
        from app_api.main import app

        app.dependency_overrides[get_current_user] = lambda: CurrentUser(
            id="test-user-1", email="test@example.com"
        )
        yield client
        del app.dependency_overrides[get_current_user]

    def test_requires_auth(self, client):
        resp = client.post(
            "/me/career-guidance",
            json={
                "resume_text": "Python developer",
                "career_goal": "become an ML engineer",
            },
        )
        assert resp.status_code == 422  # missing Authorization header

    def test_returns_500_when_gemini_not_configured(self, authed_client, monkeypatch):
        import reskilling.llm_reasoning as llm

        monkeypatch.setattr(llm, "GEMINI_API_KEY", None)
        resp = authed_client.post(
            "/me/career-guidance",
            json={
                "resume_text": "Python developer",
                "career_goal": "become an ML engineer",
            },
        )
        assert resp.status_code == 500
        assert "GEMINI_API_KEY" in resp.json()["detail"]

    def test_happy_path_classifies_suggestions(self, authed_client, monkeypatch):
        import reskilling.llm_reasoning as llm

        monkeypatch.setattr(
            llm,
            "suggest_skills_for_goal",
            lambda skills, goal: ["Python", "Quantum Computing"],
        )

        resp = authed_client.post(
            "/me/career-guidance",
            json={
                "resume_text": "Python developer",
                "career_goal": "become an ML engineer",
            },
        )
        assert resp.status_code == 200
        suggestions = resp.json()["suggestions"]
        statuses = {s["skill_name"]: s["status"] for s in suggestions}
        assert (
            statuses["Python"] == "taxonomy_match"
        )  # Python exists in synthetic taxonomy
        assert (
            statuses["Quantum Computing"] == "emerging"
        )  # not in taxonomy -- Holding Pen
        assert resp.json()["cached"] is False

    def test_second_identical_call_is_cached(self, authed_client, monkeypatch):
        import reskilling.llm_reasoning as llm

        call_count = {"n": 0}

        def fake_suggest(skills, goal):
            call_count["n"] += 1
            return ["Python"]

        monkeypatch.setattr(llm, "suggest_skills_for_goal", fake_suggest)

        body = {
            "resume_text": "Python developer",
            "career_goal": "become an ML engineer",
        }
        first = authed_client.post("/me/career-guidance", json=body)
        second = authed_client.post("/me/career-guidance", json=body)

        assert first.json()["cached"] is False
        assert second.json()["cached"] is True
        assert call_count["n"] == 1  # Gemini was only actually called once

    def test_daily_limit_enforced(self, authed_client, monkeypatch):
        import app_api.rate_limit as rl
        import reskilling.llm_reasoning as llm

        monkeypatch.setattr(
            llm, "suggest_skills_for_goal", lambda skills, goal: ["Python"]
        )

        # Exhaust the limit with distinct goals so the cache doesn't
        # short-circuit before the limit is actually reached.
        for i in range(rl.DAILY_LIMIT):
            resp = authed_client.post(
                "/me/career-guidance",
                json={"resume_text": "Python developer", "career_goal": f"goal-{i}"},
            )
            assert resp.status_code == 200

        blocked = authed_client.post(
            "/me/career-guidance",
            json={"resume_text": "Python developer", "career_goal": "one-too-many"},
        )
        assert blocked.status_code == 429

    def test_stream_endpoint_serves_cached_result_without_calling_gemini(
        self, authed_client, monkeypatch
    ):
        """
        Verifies the SSE endpoint's cache-hit fast path -- the one
        part of /me/career-guidance/stream testable without a live
        Gemini call, since a cache hit returns before any streaming
        generation is attempted.
        """
        import app_api.rate_limit as rl
        import reskilling.llm_reasoning as llm

        monkeypatch.setattr(
            llm, "suggest_skills_for_goal", lambda skills, goal: ["Python"]
        )

        body = {"resume_text": "Python developer", "career_goal": "stream-cache-test"}
        first = authed_client.post("/me/career-guidance", json=body)
        assert first.status_code == 200

        stream_resp = authed_client.post("/me/career-guidance/stream", json=body)
        assert stream_resp.status_code == 200
        assert stream_resp.headers["content-type"].startswith("text/event-stream")
        assert '"cached": true' in stream_resp.text


class TestSkillsResources:
    """Public endpoint -- no auth required, since roadmap resource
    suggestions belong on the anonymous demo path too."""

    def test_returns_search_fallback_when_no_curated_resources(
        self, client, monkeypatch
    ):
        import reskilling.db as db

        monkeypatch.setattr(db, "fetch_learning_resources", lambda skill_id: [])

        resp = client.post(
            "/skills/resources",
            json={"skills": [{"skill_id": "SKL_001", "skill_name": "Python"}]},
        )
        assert resp.status_code == 200
        links = resp.json()["resources"]["SKL_001"]
        assert len(links) > 0
        assert all(link["tier"] == "search" for link in links)

    def test_curated_resources_come_first_when_present(self, client, monkeypatch):
        import reskilling.db as db

        curated = [
            {
                "title": "Real Course",
                "url": "https://x.com",
                "provider": "X Academy",
                "is_free": True,
            }
        ]
        monkeypatch.setattr(db, "fetch_learning_resources", lambda skill_id: curated)

        resp = client.post(
            "/skills/resources",
            json={"skills": [{"skill_id": "SKL_001", "skill_name": "Python"}]},
        )
        links = resp.json()["resources"]["SKL_001"]
        assert links[0]["tier"] == "curated"
        assert links[0]["title"] == "Real Course"

    def test_skips_malformed_entries_missing_required_fields(self, client, monkeypatch):
        import reskilling.db as db

        monkeypatch.setattr(db, "fetch_learning_resources", lambda skill_id: [])

        resp = client.post(
            "/skills/resources", json={"skills": [{"skill_id": "SKL_001"}]}
        )
        assert resp.status_code == 200
        assert resp.json()["resources"] == {}


class TestRoleBasedAccess:
    @pytest.fixture
    def as_role(self, client):
        from app_api.auth import CurrentUserWithRole, get_current_user_with_role
        from app_api.main import app

        def _set(role: str):
            app.dependency_overrides[get_current_user_with_role] = lambda: (
                CurrentUserWithRole(
                    id="test-user-1", email="test@example.com", role=role
                )
            )

        yield _set
        del app.dependency_overrides[get_current_user_with_role]

    def test_my_profile_returns_role(self, client, as_role):
        as_role("workforce_analyst")
        resp = client.get("/me/profile")
        assert resp.status_code == 200
        assert resp.json()["role"] == "workforce_analyst"

    def test_admin_endpoint_rejects_job_seeker(self, client, as_role, monkeypatch):
        import reskilling.db as db

        monkeypatch.setattr(db, "list_all_profiles", lambda: [])
        as_role("job_seeker")
        resp = client.get("/admin/users")
        assert resp.status_code == 403

    def test_admin_endpoint_allows_administrator(self, client, as_role, monkeypatch):
        import reskilling.db as db

        monkeypatch.setattr(
            db,
            "list_all_profiles",
            lambda: [{"id": "u1", "email": "a@b.com", "role": "job_seeker"}],
        )
        as_role("administrator")
        resp = client.get("/admin/users")
        assert resp.status_code == 200
        assert len(resp.json()["users"]) == 1

    def test_role_update_rejects_invalid_role(self, client, as_role, monkeypatch):
        import reskilling.db as db

        def fake_update(user_id, role):
            if role not in {"job_seeker", "workforce_analyst", "administrator"}:
                raise ValueError(f"Invalid role '{role}'")

        monkeypatch.setattr(db, "update_user_role", fake_update)
        as_role("administrator")
        resp = client.patch("/admin/users/u2/role", json={"role": "super-admin"})
        assert resp.status_code == 422

    def test_role_update_succeeds_for_valid_role(self, client, as_role, monkeypatch):
        import reskilling.db as db

        monkeypatch.setattr(db, "update_user_role", lambda user_id, role: None)
        as_role("administrator")
        resp = client.patch("/admin/users/u2/role", json={"role": "workforce_analyst"})
        assert resp.status_code == 200
        assert resp.json()["role"] == "workforce_analyst"


class TestOrgAndProviderEndpoints:
    @pytest.fixture(autouse=True)
    def auth(self):
        from app_api.auth import CurrentUser, get_current_user
        from app_api.main import app

        app.dependency_overrides[get_current_user] = lambda: CurrentUser(
            id="test-user-1",
            email="test@example.com",
        )
        yield
        app.dependency_overrides.pop(get_current_user, None)

    def test_save_and_get_org_skill_framework(self, client, monkeypatch):
        saved_frameworks = [
            {"role_name": "Data Analyst", "required_skills": ["Python", "SQL"]},
            {
                "role_name": "Data Scientist",
                "required_skills": ["Python", "Statistics"],
            },
        ]

        monkeypatch.setattr(
            "reskilling.db.upsert_org_skill_frameworks",
            lambda user_id, frameworks: [
                {"id": "f1", "user_id": user_id, **frameworks[0]},
                {"id": "f2", "user_id": user_id, **frameworks[1]},
            ],
        )
        resp = client.post(
            "/org/skill-framework", json={"frameworks": saved_frameworks}
        )
        assert resp.status_code == 200
        assert resp.json()["saved"] == 2
        assert resp.json()["frameworks"][0]["role_name"] == "Data Analyst"

        monkeypatch.setattr(
            "reskilling.db.list_org_skill_frameworks",
            lambda user_id: [
                {
                    "id": "f1",
                    "user_id": user_id,
                    "role_name": "Data Analyst",
                    "required_skills": ["Python", "SQL"],
                },
            ],
        )
        resp = client.get("/org/skill-framework")
        assert resp.status_code == 200
        assert resp.json()["frameworks"][0]["role_name"] == "Data Analyst"

    def test_connect_provider_and_sync_progress(self, client, monkeypatch):
        monkeypatch.setattr(
            "reskilling.db.upsert_provider_connection",
            lambda user_id, provider: {
                "id": "p1",
                "user_id": user_id,
                "provider_name": provider["provider_name"],
                "provider_account": provider.get("provider_account"),
                "connected_at": "2026-01-01T00:00:00Z",
                "last_sync_at": None,
            },
        )
        resp = client.post(
            "/me/provider-connections",
            json={
                "provider_name": "coursera",
                "provider_account": "test@example.com",
                "access_token": "tok",
            },
        )
        assert resp.status_code == 200
        assert resp.json()["provider_name"] == "coursera"

        monkeypatch.setattr(
            "reskilling.db.sync_provider_progress",
            lambda user_id, provider_name, progress: {
                "synced": True,
                "updated_items": len(progress),
            },
        )
        resp = client.post(
            "/me/provider-connections/coursera/sync",
            json={
                "progress": [
                    {"resource_id": 1, "status": "completed", "progress_percent": 100}
                ]
            },
        )
        assert resp.status_code == 200
        assert resp.json()["synced"] is True
        assert resp.json()["updated_items"] == 1

    def test_verify_resource_link_returns_404_for_missing(self, client, monkeypatch):
        monkeypatch.setattr(
            "reskilling.db.verify_learning_resource_link",
            lambda resource_id: (_ for _ in ()).throw(ValueError("Resource not found")),
        )
        resp = client.post("/resources/999/verify")
        assert resp.status_code == 404

    def test_verify_resource_link_succeeds(self, client, monkeypatch):
        monkeypatch.setattr(
            "reskilling.db.verify_learning_resource_link",
            lambda resource_id: {
                "id": resource_id,
                "last_verified_at": "2026-01-01T00:00:00Z",
                "last_link_status": "ok",
            },
        )
        resp = client.post("/resources/999/verify")
        assert resp.status_code == 200
        assert resp.json()["last_link_status"] == "ok"
