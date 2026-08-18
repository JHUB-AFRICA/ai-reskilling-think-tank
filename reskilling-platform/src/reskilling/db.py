"""
db.py

Postgres connection layer for Phase C. Deliberately uses plain
SQLAlchemy + psycopg, not the Supabase Python SDK -- per the Unified
Platform Architecture Proposal \u00a78.2, Supabase was chosen specifically
for its portable, standard Postgres underneath, and using its SDK for
basic querying would reintroduce the vendor lock-in that decision was
meant to avoid. The Supabase SDK remains appropriate later specifically
for auth (magic links, OAuth flows) where it adds real value beyond
what plain Postgres access offers -- see auth.py.

Reads DATABASE_URL from the environment (never hardcoded, never
committed) via python-dotenv, matching the .env convention already
established in Phase 1's project scaffold.
"""

from __future__ import annotations

import logging
import os
from functools import lru_cache

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger(__name__)


class MissingDatabaseUrlError(RuntimeError):
    """Raised when DATABASE_URL is not set -- fails loudly and early
    rather than letting a downstream SQLAlchemy error obscure the real
    cause (a missing .env file or unset environment variable)."""


@lru_cache(maxsize=1)
def get_engine() -> Engine:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise MissingDatabaseUrlError(
            "DATABASE_URL is not set. Copy .env.example to .env and fill in "
            "the connection string from Supabase's Project Settings -> "
            "Database -> Connection string (URI format)."
        )
    logger.info("Connecting to Postgres (connection string redacted from logs)")
    return create_engine(database_url, pool_pre_ping=True)


def check_connection() -> bool:
    """Smoke test -- run this first after setting DATABASE_URL, before
    running the migration script, to fail fast on a bad connection
    string rather than midway through a data load."""
    from sqlalchemy import text

    try:
        with get_engine().connect() as conn:
            conn.execute(text("select 1"))
        return True
    except Exception as exc:  # noqa: BLE001 -- intentionally broad for a smoke test
        logger.error("Database connection check failed: %s", exc)
        return False


def insert_gap_analysis(
    user_id: str,
    occupation_title: str,
    readiness_score: float,
    matched_skill_ids: list[str],
    missing_skill_ids: list[str],
) -> int:
    """Persists one completed gap analysis for an authenticated user.
    Requires db/migrations/003_create_gap_analyses_table.sql applied."""
    from sqlalchemy import text

    with get_engine().begin() as conn:
        result = conn.execute(
            text(
                """
                insert into gap_analyses
                    (user_id, occupation_title, readiness_score,
                     matched_skill_ids, missing_skill_ids)
                values (:user_id, :occupation_title, :readiness_score,
                        :matched_skill_ids, :missing_skill_ids)
                returning id
                """
            ),
            {
                "user_id": user_id,
                "occupation_title": occupation_title,
                "readiness_score": readiness_score,
                "matched_skill_ids": matched_skill_ids,
                "missing_skill_ids": missing_skill_ids,
            },
        )
        return result.scalar_one()


def fetch_gap_analyses_for_user(user_id: str, limit: int = 50) -> list[dict]:
    from sqlalchemy import text

    with get_engine().connect() as conn:
        rows = conn.execute(
            text(
                """
                select id, occupation_title, readiness_score, matched_skill_ids,
                       missing_skill_ids, created_at
                from gap_analyses
                where user_id = :user_id
                order by created_at desc
                limit :limit
                """
            ),
            {"user_id": user_id, "limit": limit},
        ).mappings()
        return [dict(row) for row in rows]


def insert_xapi_statement(user_id: str | None, statement: dict) -> int:
    """Persists one xAPI statement to Postgres -- the Phase C
    replacement for lrs.py's local JSONL file, per
    db/migrations/002_create_lrs_table.sql's schema."""
    import json

    from sqlalchemy import text

    with get_engine().begin() as conn:
        result = conn.execute(
            text(
                """
                insert into xapi_statements
                    (user_id, actor_email, verb_id, verb_display,
                     object_id, object_name, result_extensions)
                values (:user_id, :actor_email, :verb_id, :verb_display,
                        :object_id, :object_name, :result_extensions)
                returning id
                """
            ),
            {
                "user_id": user_id,
                "actor_email": statement["actor"]["mbox"].replace("mailto:", ""),
                "verb_id": statement["verb"]["id"],
                "verb_display": statement["verb"]["display"]["en-US"],
                "object_id": statement["object"]["id"],
                "object_name": statement["object"]["definition"]["name"]["en-US"],
                "result_extensions": json.dumps(statement.get("result", {}).get("extensions")),
            },
        )
        return result.scalar_one()


# --------------------------------------------------------------------------
# Role-based access (profiles table, db/migrations/004)
# --------------------------------------------------------------------------

def get_user_profile(user_id: str) -> dict | None:
    """
    Returns None if no profile row exists yet -- this can genuinely
    happen if the auth trigger (004's handle_new_user()) hasn't fired
    yet for a brand-new signup, or if a user was created before the
    trigger existed. Callers (see app_api/auth.py's
    get_current_user_with_role) must handle None explicitly rather
    than assuming a profile always exists.
    """
    from sqlalchemy import text

    with get_engine().connect() as conn:
        row = conn.execute(
            text(
                "select id, email, role, full_name, target_career, experience_level, "
                "created_at, updated_at from profiles where id = :user_id"
            ),
            {"user_id": user_id},
        ).mappings().first()
        return dict(row) if row else None


def list_all_profiles() -> list[dict]:
    """Admin-only -- callers must enforce that via
    app_api/auth.py's require_role("administrator") dependency; this
    function itself has no authorization logic, matching the pattern
    established for every other db.py function (auth is the API
    layer's responsibility, not this layer's)."""
    from sqlalchemy import text

    with get_engine().connect() as conn:
        rows = conn.execute(
            text("select id, email, role, created_at from profiles order by created_at desc")
        ).mappings()
        return [dict(row) for row in rows]


def update_user_role(user_id: str, new_role: str) -> None:
    valid_roles = {"job_seeker", "workforce_analyst", "administrator"}
    if new_role not in valid_roles:
        raise ValueError(f"Invalid role '{new_role}'. Must be one of {valid_roles}.")

    from sqlalchemy import text

    with get_engine().begin() as conn:
        conn.execute(
            text("update profiles set role = :role where id = :user_id"),
            {"role": new_role, "user_id": user_id},
        )


# --------------------------------------------------------------------------
# Learning resources (learning_resources table, db/migrations/005)
# --------------------------------------------------------------------------

def fetch_learning_resources(skill_id: str, skill_name: str | None = None) -> list[dict]:
    from sqlalchemy import text

    with get_engine().connect() as conn:
        rows = conn.execute(
            text(
                "select id, skill_id, skill_name, title, url, provider, is_free, description, "
                "resource_type, difficulty, duration_minutes, language, verification_status, "
                "prerequisites, phase, last_verified_at, last_link_status "
                "from learning_resources where skill_id = :skill_id or (:skill_name is not null and skill_name ilike :skill_name) "
                "order by case verification_status when 'verified' then 0 when 'provider_synced' then 1 else 2 end, created_at"
            ),
            {"skill_id": skill_id, "skill_name": f"%{skill_name}%" if skill_name else None},
        ).mappings()
        return [dict(row) for row in rows]


def upsert_org_skill_frameworks(user_id: str, frameworks: list[dict]) -> list[dict]:
    from sqlalchemy import text

    with get_engine().begin() as conn:
        rows = conn.execute(
            text(
                """
                insert into company_skill_frameworks
                    (user_id, role_name, required_skills)
                values (:user_id, :role_name, :required_skills)
                on conflict (user_id, role_name) do update set
                    required_skills = excluded.required_skills,
                    updated_at = now()
                returning id, user_id, role_name, required_skills, created_at, updated_at
                """
            ),
            [
                {
                    "user_id": user_id,
                    "role_name": fw["role_name"],
                    "required_skills": fw["required_skills"],
                }
                for fw in frameworks
            ],
        ).mappings()
        return [dict(row) for row in rows]


def list_org_skill_frameworks(user_id: str) -> list[dict]:
    from sqlalchemy import text

    with get_engine().connect() as conn:
        rows = conn.execute(
            text(
                "select id, user_id, role_name, required_skills, created_at, updated_at "
                "from company_skill_frameworks where user_id = :user_id order by role_name"
            ),
            {"user_id": user_id},
        ).mappings()
        return [dict(row) for row in rows]


def upsert_provider_connection(user_id: str, provider: dict) -> dict:
    from sqlalchemy import text

    with get_engine().begin() as conn:
        row = conn.execute(
            text(
                """
                insert into provider_connections
                    (user_id, provider_name, provider_account, access_token, last_sync_at)
                values (:user_id, :provider_name, :provider_account, :access_token, null)
                on conflict (user_id, provider_name) do update set
                    provider_account = excluded.provider_account,
                    access_token = excluded.access_token,
                    updated_at = now()
                returning id, user_id, provider_name, provider_account, connected_at, last_sync_at, created_at, updated_at
                """
            ),
            {
                "user_id": user_id,
                "provider_name": provider["provider_name"],
                "provider_account": provider.get("provider_account"),
                "access_token": provider.get("access_token"),
            },
        ).mappings().one()
        return dict(row)


def list_provider_connections(user_id: str) -> list[dict]:
    from sqlalchemy import text

    with get_engine().connect() as conn:
        rows = conn.execute(
            text(
                "select id, provider_name, provider_account, connected_at, last_sync_at "
                "from provider_connections where user_id = :user_id order by provider_name"
            ),
            {"user_id": user_id},
        ).mappings()
        return [dict(row) for row in rows]


def sync_provider_progress(user_id: str, provider_name: str, progress: list[dict] | None = None) -> dict:
    from sqlalchemy import text

    updates = 0
    with get_engine().begin() as conn:
        conn.execute(
            text(
                "update provider_connections set last_sync_at = now(), updated_at = now() "
                "where user_id = :user_id and provider_name = :provider_name"
            ),
            {"user_id": user_id, "provider_name": provider_name},
        )
        if progress:
            for item in progress:
                if item.get("resource_id") is None:
                    continue
                conn.execute(
                    text(
                        "insert into user_learning_items "
                        "(user_id, resource_id, analysis_id, status, progress_percent, time_spent_minutes, notes, evidence_url, completion_source, started_at, completed_at) "
                        "values (:user_id, :resource_id, null, :status, :progress_percent, 0, null, :evidence_url, 'provider_verified', "
                        "case when :progress_percent = 100 then now() else null end, "
                        "case when :progress_percent = 100 then now() else null end) "
                        "on conflict (user_id, resource_id) do update set "
                        "status = excluded.status, progress_percent = excluded.progress_percent, "
                        "evidence_url = excluded.evidence_url, completion_source = 'provider_verified', updated_at = now()"
                    ),
                    {
                        "user_id": user_id,
                        "resource_id": item["resource_id"],
                        "status": item.get("status", "in_progress"),
                        "progress_percent": int(item.get("progress_percent", 0)),
                        "evidence_url": item.get("evidence_url"),
                    },
                )
                updates += 1

    return {"synced": True, "last_sync_at": None, "updated_items": updates}


def verify_learning_resource_link(resource_id: int) -> dict:
    import requests
    from sqlalchemy import text

    with get_engine().connect() as conn:
        row = conn.execute(
            text("select id, url from learning_resources where id = :resource_id"),
            {"resource_id": resource_id},
        ).mappings().first()
        if row is None:
            raise ValueError("Resource not found")
        url = row["url"]

    try:
        resp = requests.head(url, timeout=10, allow_redirects=True)
        status = "ok" if 200 <= resp.status_code < 400 else "broken"
    except Exception:
        status = "broken"

    with get_engine().begin() as conn:
        result = conn.execute(
            text(
                "update learning_resources set last_verified_at = now(), last_link_status = :status "
                "where id = :resource_id returning id, last_verified_at, last_link_status"
            ),
            {"resource_id": resource_id, "status": status},
        ).mappings().one()
        return dict(result)


def list_skill_evidence(user_id: str) -> list[dict]:
    from sqlalchemy import text

    with get_engine().connect() as conn:
        rows = conn.execute(
            text("select id, skill_id, skill_name, evidence_type, evidence_url, description, assessment_score, verification_status, created_at from skill_evidence where user_id = :user_id order by created_at desc"),
            {"user_id": user_id},
        ).mappings()
        return [dict(row) for row in rows]


def list_learning_resources(
    query: str | None = None,
    skill: str | None = None,
    verification_status: str | None = None,
    limit: int = 50,
) -> list[dict]:
    """Browse the catalogue without presenting unverified links as curated."""
    from sqlalchemy import text

    clauses = ["1=1"]
    params: dict = {"limit": min(max(limit, 1), 100)}
    if query:
        clauses.append("(title ilike :query or provider ilike :query or description ilike :query)")
        params["query"] = f"%{query.strip()}%"
    if skill:
        clauses.append("skill_name ilike :skill")
        params["skill"] = f"%{skill.strip()}%"
    if verification_status:
        clauses.append("verification_status = :verification_status")
        params["verification_status"] = verification_status

    with get_engine().connect() as conn:
        rows = conn.execute(
            text(
                "select id, skill_id, skill_name, title, url, provider, is_free, description, "
                "resource_type, difficulty, duration_minutes, language, verification_status, last_verified_at "
                "from learning_resources where " + " and ".join(clauses) + " "
                "order by case verification_status when 'verified' then 0 when 'provider_synced' then 1 else 2 end, created_at desc "
                "limit :limit"
            ),
            params,
        ).mappings()
        return [dict(row) for row in rows]


def upsert_user_learning_item(user_id: str, resource_id: int, payload: dict) -> dict:
    """Create or update the current user's progress for one catalogue item."""
    from sqlalchemy import text

    allowed_statuses = {"saved", "not_started", "in_progress", "completed", "abandoned"}
    status = payload.get("status", "saved")
    if status not in allowed_statuses:
        raise ValueError(f"Invalid learning status '{status}'.")
    progress = int(payload.get("progress_percent", 0))
    if not 0 <= progress <= 100:
        raise ValueError("progress_percent must be between 0 and 100.")

    with get_engine().begin() as conn:
        row = conn.execute(
            text(
                """
                insert into user_learning_items
                    (user_id, resource_id, analysis_id, status, progress_percent,
                     time_spent_minutes, notes, evidence_url, completion_source, started_at, completed_at)
                values
                    (:user_id, :resource_id, :analysis_id, :status, :progress_percent,
                     :time_spent_minutes, :notes, :evidence_url, :completion_source,
                     case when :status in ('in_progress', 'completed') then now() else null end,
                     case when :status = 'completed' then now() else null end)
                on conflict (user_id, resource_id) do update set
                    status = excluded.status,
                    progress_percent = excluded.progress_percent,
                    time_spent_minutes = excluded.time_spent_minutes,
                    notes = excluded.notes,
                    evidence_url = excluded.evidence_url,
                    completion_source = excluded.completion_source,
                    started_at = coalesce(user_learning_items.started_at, excluded.started_at),
                    completed_at = case when excluded.status = 'completed' then now() else user_learning_items.completed_at end,
                    updated_at = now()
                returning id, user_id, resource_id, analysis_id, status, progress_percent,
                          time_spent_minutes, notes, evidence_url, completion_source,
                          started_at, completed_at, created_at, updated_at
                """
            ),
            {
                "user_id": user_id,
                "resource_id": resource_id,
                "analysis_id": payload.get("analysis_id"),
                "status": status,
                "progress_percent": progress,
                "time_spent_minutes": max(0, int(payload.get("time_spent_minutes", 0))),
                "notes": payload.get("notes"),
                "evidence_url": payload.get("evidence_url"),
                "completion_source": payload.get("completion_source", "self_reported"),
            },
        ).mappings().one()
        return dict(row)


def list_user_learning_items(user_id: str) -> list[dict]:
    from sqlalchemy import text

    with get_engine().connect() as conn:
        rows = conn.execute(
            text(
                """
                select uli.id, uli.status, uli.progress_percent, uli.time_spent_minutes,
                       uli.notes, uli.evidence_url, uli.completion_source, uli.started_at,
                       uli.completed_at, uli.updated_at, lr.id as resource_id, lr.title,
                       lr.url, lr.provider, lr.skill_name, lr.is_free, lr.resource_type,
                       lr.difficulty, lr.duration_minutes, lr.verification_status
                from user_learning_items uli
                join learning_resources lr on lr.id = uli.resource_id
                where uli.user_id = :user_id
                order by uli.updated_at desc
                """
            ),
            {"user_id": user_id},
        ).mappings()
        return [dict(row) for row in rows]


# --------------------------------------------------------------------------
# CareerDev integration: extended profile fields (006) and the
# career_analyses table (007). Kept as a distinct section since these
# serve a specific external frontend's data shape, not the platform's
# own gap_analyses/analyze-gap flow.
# --------------------------------------------------------------------------

def upsert_profile_details(
    user_id: str,
    email: str | None = None,
    full_name: str | None = None,
    target_career: str | None = None,
    experience_level: str | None = None,
) -> dict:
    """
    Updates only the CareerDev-facing fields on the user's own profile
    row -- never role, which has no client-writable path anywhere in
    this codebase (see 004_create_profiles_table.sql). Uses COALESCE
    so omitted fields (None) don't overwrite existing values with null.
    """
    from sqlalchemy import text

    with get_engine().begin() as conn:
        row = conn.execute(
            text(
                """
                insert into profiles (id, email, full_name, target_career, experience_level)
                values (:user_id, :email, :full_name, :target_career, :experience_level)
                on conflict (id) do update set
                    full_name = coalesce(excluded.full_name, profiles.full_name),
                    target_career = coalesce(excluded.target_career, profiles.target_career),
                    experience_level = coalesce(excluded.experience_level, profiles.experience_level)
                returning id, email, role, full_name, target_career, experience_level, created_at, updated_at
                """
            ),
            {
                "user_id": user_id,
                "email": email or f"{user_id}@local.invalid",
                "full_name": full_name,
                "target_career": target_career,
                "experience_level": experience_level,
            },
        ).mappings().first()
        return dict(row) if row else {}


def insert_career_analysis(user_id: str, analysis: dict) -> dict:
    import json

    from sqlalchemy import text

    with get_engine().begin() as conn:
        row = conn.execute(
            text(
                """
                insert into career_analyses
                    (user_id, current_career, target_career, experience_level,
                     current_skills, goals, readiness_score, summary,
                     skill_gaps, learning_recommendations, matched_taxonomy)
                values
                    (:user_id, :current_career, :target_career, :experience_level,
                     :current_skills, :goals, :readiness_score, :summary,
                     :skill_gaps, :learning_recommendations, :matched_taxonomy)
                returning id, user_id, current_career, target_career, experience_level,
                          current_skills, goals, readiness_score, summary,
                          skill_gaps, learning_recommendations, matched_taxonomy, created_at
                """
            ),
            {
                "user_id": user_id,
                "current_career": analysis["current_career"],
                "target_career": analysis["target_career"],
                "experience_level": analysis["experience_level"],
                "current_skills": analysis["current_skills"],
                "goals": analysis.get("goals"),
                "readiness_score": analysis["readiness_score"],
                "summary": analysis.get("summary"),
                "skill_gaps": json.dumps(analysis["skill_gaps"]),
                "learning_recommendations": json.dumps(analysis["learning_recommendations"]),
                "matched_taxonomy": analysis["matched_taxonomy"],
            },
        ).mappings().first()
        return dict(row)


def list_career_analyses(user_id: str, limit: int = 50) -> list[dict]:
    from sqlalchemy import text

    with get_engine().connect() as conn:
        rows = conn.execute(
            text(
                """
                select id, user_id, current_career, target_career, experience_level,
                       current_skills, goals, readiness_score, summary,
                       skill_gaps, learning_recommendations, matched_taxonomy, created_at
                from career_analyses
                where user_id = :user_id
                order by created_at desc
                limit :limit
                """
            ),
            {"user_id": user_id, "limit": limit},
        ).mappings()
        return [dict(row) for row in rows]


def delete_career_analyses_for_user(user_id: str) -> int:
    from sqlalchemy import text

    with get_engine().begin() as conn:
        result = conn.execute(
            text("delete from career_analyses where user_id = :user_id"),
            {"user_id": user_id},
        )
        return result.rowcount


def update_career_analysis_recommendations(
    analysis_id: str, user_id: str, recommendations: list[dict]
) -> dict | None:
    """Returns None if no row matches both analysis_id AND user_id --
    the ownership check happens in the WHERE clause itself, not as a
    separate lookup-then-check, so there is no window where a
    mismatched owner could still see the row."""
    import json

    from sqlalchemy import text

    with get_engine().begin() as conn:
        row = conn.execute(
            text(
                """
                update career_analyses
                set learning_recommendations = :recommendations
                where id = :analysis_id and user_id = :user_id
                returning id, user_id, current_career, target_career, experience_level,
                          current_skills, goals, readiness_score, summary,
                          skill_gaps, learning_recommendations, matched_taxonomy, created_at
                """
            ),
            {
                "analysis_id": analysis_id,
                "user_id": user_id,
                "recommendations": json.dumps(recommendations),
            },
        ).mappings().first()
        return dict(row) if row else None


if __name__ == "__main__":
    if check_connection():
        print("Connected successfully.")
    else:
        print("Connection failed -- check DATABASE_URL in your .env file.")
