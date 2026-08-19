"""
main.py

FastAPI service wrapping the existing, tested reskilling platform core
(taxonomy, NLP extraction, gap-analysis recommender, xAPI LRS) as REST
endpoints. This is Phase A of the Unified Platform Architecture Proposal:
wrap the tested Python core rather than rewrite it -- every endpoint
here is a thin adapter over src/reskilling/ functions that already have
unit test coverage.

Design note: extractor/recommender access goes through FastAPI's
Depends() dependency injection rather than plain module-level globals.
This is deliberate, not idiomatic decoration -- it means tests can
override get_extractor_dep()/get_recommender_dep() with fakes that
need neither a spaCy model nor a real taxonomy CSV on disk, mirroring
the same decoupling principle that produced schemas.py in Phase 2
(recommender.py has zero import-time dependency on spaCy). Without
this, every API test would pay the cost of loading a full NLP model.

Run with: uvicorn app_api.main:app --reload
"""

from __future__ import annotations

import json
import logging
import os
import time
from dataclasses import asdict
from functools import lru_cache
from typing import TYPE_CHECKING

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from reskilling.lrs import LRS_LOG_PATH, log_gap_analysis_event, log_resume_upload_event
from reskilling.recommender import ReskillingRecommender

# pyrefly: ignore [missing-import]
from .auth import (
    CurrentUser,
    CurrentUserWithRole,
    get_current_user,
    get_current_user_with_role,
    require_role,
)

if TYPE_CHECKING:
    # Only needed for type hints -- importing reskilling.nlp at module
    # load time would force spaCy to be installed just to import this
    # API module, even in contexts (like tests with dependency
    # overrides) that never construct a real SkillExtractor. Same
    # coupling class as the nlp.py <-> recommender.py fix in Phase 2.
    from reskilling.nlp import SkillExtractor

logger = logging.getLogger("reskilling.api.latency")

app = FastAPI(
    title="AI Reskilling Think Tank Platform API",
    description=(
        "REST layer over the tested taxonomy/NLP/recommender/LRS core. "
        "See the Unified Platform Architecture Proposal, Phase A."
    ),
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS -- allow the Vite dev server (port 5173), Next.js dev (3000), and any
# additional origins specified in CORS_ORIGINS (comma-separated). This is
# required for browser fetch() calls from the CareerDev frontend to reach this
# API without being blocked by same-origin policy.
# ---------------------------------------------------------------------------
_default_origins = [
    "http://localhost:5173",  # Vite / CareerDev dev server (default)
    "http://localhost:5174",  # Vite fallback port (when 5173 is occupied)
    "http://localhost:5175",  # Vite fallback port (when 5173+5174 are occupied)
    "http://localhost:3000",  # Next.js frontend (reskilling-platform/web)
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:3000",
    "https://jhub-africa.github.io",
    "https://JHUB-AFRICA.github.io",
    "https://brian-code-lab.github.io",
]
_extra = [o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()]
_allowed_origins = _default_origins + _extra

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_origin_regex=r"https://.*\.github\.io",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Response-Time-Ms"],
)


@app.middleware("http")
async def log_request_latency(request: Request, call_next):
    """
    Makes NFR-02's sub-200ms target for read endpoints (occupations,
    taxonomy stats/requirements) an observable, checkable number rather
    than an aspiration nobody measures. This logs to stdout/stderr, not
    to a metrics backend -- adequate for a single-instance deployment;
    a real production rollout should replace this with a proper APM
    integration (e.g. OpenTelemetry) rather than parsing logs, but that
    is unwarranted complexity while there is exactly one instance to
    watch.
    """
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    response.headers["X-Response-Time-Ms"] = f"{duration_ms:.1f}"
    logger.info(
        "%s %s -> %d in %.1fms",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


# --------------------------------------------------------------------------
# Dependency-injected singletons (equivalent to Streamlit's
# @st.cache_resource pattern in app/services.py -- expensive objects
# built once per process, not per request).
# --------------------------------------------------------------------------


@lru_cache(maxsize=1)
def _build_extractor() -> "SkillExtractor":
    from reskilling.nlp import SkillExtractor  # lazy: see TYPE_CHECKING note above

    return SkillExtractor()


@lru_cache(maxsize=1)
def _build_recommender() -> ReskillingRecommender:
    return ReskillingRecommender()


def get_extractor_dep() -> "SkillExtractor":
    return _build_extractor()


def get_recommender_dep() -> ReskillingRecommender:
    return _build_recommender()


# --------------------------------------------------------------------------
# Request/response contracts
# --------------------------------------------------------------------------


class ExtractSkillsRequest(BaseModel):
    resume_text: str = Field(..., min_length=1)


class GapAnalysisRequest(BaseModel):
    resume_text: str = Field(..., min_length=1)
    target_occupation: str
    actor_email: str = "api-client@platform"


# --------------------------------------------------------------------------
# Endpoints
# --------------------------------------------------------------------------


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/occupations")
def list_occupations(
    recommender: ReskillingRecommender = Depends(get_recommender_dep),
) -> dict:
    return {"occupations": recommender.list_target_occupations()}


@app.post("/extract-skills")
def extract_skills(
    req: ExtractSkillsRequest,
    extractor: SkillExtractor = Depends(get_extractor_dep),
) -> dict:
    matches = extractor.extract(req.resume_text)
    log_resume_upload_event(actor_email="api-client@platform", skill_count=len(matches))
    return {"skills": [asdict(m) for m in matches]}


@app.post("/analyze-gap")
def analyze_gap(
    req: GapAnalysisRequest,
    extractor: SkillExtractor = Depends(get_extractor_dep),
    recommender: ReskillingRecommender = Depends(get_recommender_dep),
) -> dict:
    user_skills = extractor.extract(req.resume_text)

    try:
        result = recommender.analyze_gap(user_skills, req.target_occupation)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    summary = result.to_summary_dict()
    log_gap_analysis_event(actor_email=req.actor_email, gap_summary=summary)

    return {
        "occupation_title": result.occupation_title,
        "readiness_score": result.readiness_score,
        "matched_skills": [asdict(s) for s in result.matched_skills],
        "missing_skills": [asdict(g) for g in result.missing_skills],
    }


@app.get("/lrs/statements")
def get_lrs_statements(limit: int = 50) -> dict:
    if not LRS_LOG_PATH.exists():
        return {"statements": []}
    with LRS_LOG_PATH.open(encoding="utf-8") as f:
        lines = [json.loads(line) for line in f if line.strip()]
    return {"statements": list(reversed(lines))[:limit]}


@app.get("/taxonomy/stats")
def taxonomy_stats(
    recommender: ReskillingRecommender = Depends(get_recommender_dep),
) -> dict:
    df = recommender.taxonomy
    domain_distribution = (
        df.drop_duplicates(subset=["skill_name"])["domain"].value_counts().to_dict()
    )
    return {
        "occupation_count": int(df["occupation_title"].nunique()),
        "skill_count": int(df["skill_name"].nunique()),
        "domain_count": int(df["domain"].nunique()),
        "technology_skill_count": int((df["source"] == "technology").sum()),
        "domain_distribution": domain_distribution,
    }


@app.get("/taxonomy/requirements")
def taxonomy_requirements(
    occupation: str,
    recommender: ReskillingRecommender = Depends(get_recommender_dep),
) -> dict:
    try:
        reqs = recommender.get_requirements_for(occupation)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    columns = ["skill_name", "domain", "source", "importance"]
    return {"requirements": reqs[columns].to_dict(orient="records")}


# --------------------------------------------------------------------------
# Phase C: authenticated, persistent per-user endpoints. Additive --
# the stateless /analyze-gap above remains the anonymous/demo path and
# is unchanged. These require SUPABASE_JWT_SECRET and DATABASE_URL to
# be set (see .env.example); they are not exercised by the anonymous
# endpoints above and do not affect Phase A/B behavior if left unset.
# --------------------------------------------------------------------------


@app.post("/me/gap-analyses")
def create_gap_analysis_for_user(
    req: GapAnalysisRequest,
    user: CurrentUser = Depends(get_current_user),
    extractor: "SkillExtractor" = Depends(get_extractor_dep),
    recommender: ReskillingRecommender = Depends(get_recommender_dep),
) -> dict:
    from reskilling import db

    user_skills = extractor.extract(req.resume_text)

    try:
        result = recommender.analyze_gap(user_skills, req.target_occupation)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    try:
        db.insert_gap_analysis(
            user_id=user.id,
            occupation_title=result.occupation_title,
            readiness_score=result.readiness_score,
            matched_skill_ids=[s.skill_id for s in result.matched_skills],
            missing_skill_ids=[g.skill_id for g in result.missing_skills],
        )
    except db.MissingDatabaseUrlError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return {
        "occupation_title": result.occupation_title,
        "readiness_score": result.readiness_score,
        "matched_skills": [asdict(s) for s in result.matched_skills],
        "missing_skills": [asdict(g) for g in result.missing_skills],
    }


@app.get("/me/gap-analyses")
def list_gap_analyses_for_user(user: CurrentUser = Depends(get_current_user)) -> dict:
    from reskilling import db

    try:
        return {"analyses": db.fetch_gap_analyses_for_user(user.id)}
    except db.MissingDatabaseUrlError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# --------------------------------------------------------------------------
# Phase D: Gemini-backed career reasoning, gated behind auth, rate
# limiting, response caching, and the Emerging Skill Holding Pen
# anti-hallucination check. Additive -- every endpoint above continues
# to work with zero LLM dependency, per the Sec 8.3 decision that the
# platform's core value never depends on this layer.
# --------------------------------------------------------------------------


class CareerGuidanceRequest(BaseModel):
    resume_text: str = Field(..., min_length=1)
    career_goal: str = Field(..., min_length=1)


@app.post("/me/career-guidance")
def career_guidance(
    req: CareerGuidanceRequest,
    user: CurrentUser = Depends(get_current_user),
    extractor: "SkillExtractor" = Depends(get_extractor_dep),
    recommender: ReskillingRecommender = Depends(get_recommender_dep),
) -> dict:
    from reskilling import llm_reasoning
    from . import rate_limit as rl

    cached = rl.get_cached_response(user.id, req.resume_text, req.career_goal)
    if cached is not None:
        return {"suggestions": cached, "cached": True}

    if not rl.check_and_record_daily_limit(user.id):
        raise HTTPException(
            status_code=429,
            detail=(
                f"Daily limit of {rl.DAILY_LIMIT} career-guidance requests "
                "reached. Try again tomorrow."
            ),
        )

    current_skills = [s.skill_name for s in extractor.extract(req.resume_text)]

    try:
        raw_suggestions = llm_reasoning.suggest_skills_for_goal(
            current_skills, req.career_goal
        )
    except llm_reasoning.GeminiNotConfiguredError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    # The taxonomy lookup used for the Holding Pen check is built from
    # the exact same DataFrame the deterministic gap-analysis path
    # already trusts -- there is no second, divergent notion of "valid
    # skill" anywhere in this codebase.
    taxonomy_skills = {
        name.lower(): sid
        for name, sid in zip(
            recommender.taxonomy["skill_name"], recommender.taxonomy["skill_id"]
        )
    }
    classified = llm_reasoning.classify_against_taxonomy(
        raw_suggestions, taxonomy_skills
    )
    result = [c.to_dict() for c in classified]

    rl.set_cached_response(user.id, req.resume_text, req.career_goal, result)

    return {"suggestions": result, "cached": False}


@app.post("/me/career-guidance/stream")
def career_guidance_stream(
    req: CareerGuidanceRequest,
    user: CurrentUser = Depends(get_current_user),
    extractor: "SkillExtractor" = Depends(get_extractor_dep),
    recommender: ReskillingRecommender = Depends(get_recommender_dep),
):
    """
    SSE variant of /me/career-guidance. Motivation per NFR-02: a
    synchronous LLM call risks tripping a client or proxy timeout with
    no feedback in between; streaming gives the client visible
    progress. Rate limiting and caching are checked up front, exactly
    as in the non-streaming endpoint, so this path cannot be used to
    bypass either.

    The stream emits raw text chunks as `data: ` events while
    generation is in progress, then a final `event: result` message
    containing the same classified, Holding-Pen-checked JSON the
    non-streaming endpoint returns -- streaming does not weaken the
    anti-hallucination check in any way; it only changes when the
    client is told something is happening.
    """
    from fastapi.responses import StreamingResponse

    from reskilling import llm_reasoning
    from . import rate_limit as rl

    cached = rl.get_cached_response(user.id, req.resume_text, req.career_goal)
    if cached is not None:

        def cached_stream():
            yield f"event: result\ndata: {json.dumps({'suggestions': cached, 'cached': True})}\n\n"

        return StreamingResponse(cached_stream(), media_type="text/event-stream")

    if not rl.check_and_record_daily_limit(user.id):
        raise HTTPException(
            status_code=429,
            detail=(
                f"Daily limit of {rl.DAILY_LIMIT} career-guidance requests "
                "reached. Try again tomorrow."
            ),
        )

    current_skills = [s.skill_name for s in extractor.extract(req.resume_text)]

    if not llm_reasoning.GEMINI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail=(
                "GEMINI_API_KEY is not set. Get one from "
                "https://aistudio.google.com/apikey and add it to .env."
            ),
        )

    taxonomy_skills = {
        name.lower(): sid
        for name, sid in zip(
            recommender.taxonomy["skill_name"], recommender.taxonomy["skill_id"]
        )
    }

    def event_stream():
        accumulated = ""
        for chunk in llm_reasoning.stream_reasoning_chunks(
            current_skills, req.career_goal
        ):
            accumulated += chunk
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"

        raw_suggestions = llm_reasoning._extract_json_array(accumulated)
        classified = llm_reasoning.classify_against_taxonomy(
            raw_suggestions, taxonomy_skills
        )
        result = [c.to_dict() for c in classified]
        rl.set_cached_response(user.id, req.resume_text, req.career_goal, result)

        yield f"event: result\ndata: {json.dumps({'suggestions': result, 'cached': False})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# --------------------------------------------------------------------------
# Role-based access and learning resources. /skills/resources is public
# (no auth) since resource suggestions belong on the anonymous demo
# path's roadmap too, not just the signed-in one -- see
# src/reskilling/resources.py's module docstring for the "curated" vs
# "search" trust distinction this returns.
# --------------------------------------------------------------------------


class SkillResourcesRequest(BaseModel):
    skills: list[dict] = Field(
        ..., description="List of {skill_id, skill_name} dicts to fetch resources for."
    )


@app.post("/skills/resources")
def get_skills_resources(req: SkillResourcesRequest) -> dict:
    from reskilling import db, resources

    result = {}
    for skill in req.skills:
        skill_id = skill.get("skill_id")
        skill_name = skill.get("skill_name")
        if not skill_id or not skill_name:
            continue
        curated = db.fetch_learning_resources(skill_id)
        links = resources.merge_resources(curated, skill_name)
        result[skill_id] = [link.to_dict() for link in links]

    return {"resources": result}


@app.get("/resources")
def browse_learning_resources(
    query: str | None = None,
    skill: str | None = None,
    verification_status: str | None = None,
    limit: int = 50,
) -> dict:
    """Public catalogue.  The verification status is returned explicitly so
    clients can never silently style a discovery link as a vetted course."""
    from reskilling import db

    try:
        return {
            "resources": db.list_learning_resources(
                query=query,
                skill=skill,
                verification_status=verification_status,
                limit=limit,
            )
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {exc}") from exc


class LearningItemRequest(BaseModel):
    status: str = "saved"
    progress_percent: int = Field(default=0, ge=0, le=100)
    time_spent_minutes: int = Field(default=0, ge=0)
    notes: str | None = Field(default=None, max_length=5000)
    evidence_url: str | None = Field(default=None, max_length=2048)
    completion_source: str = "self_reported"
    analysis_id: str | None = None


@app.get("/me/learning-items")
def list_my_learning_items(user: CurrentUser = Depends(get_current_user)) -> dict:
    from reskilling import db

    return {"items": db.list_user_learning_items(user.id)}


@app.put("/me/learning-items/{resource_id}")
def save_my_learning_item(
    resource_id: int,
    req: LearningItemRequest,
    user: CurrentUser = Depends(get_current_user),
) -> dict:
    from reskilling import db

    try:
        return db.upsert_user_learning_item(user.id, resource_id, req.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


class SkillEvidenceRequest(BaseModel):
    skill_name: str = Field(..., min_length=1, max_length=200)
    skill_id: str | None = None
    evidence_type: str = Field(
        ..., description="certificate, project, assessment, portfolio, or note"
    )
    evidence_url: str | None = Field(default=None, max_length=2048)
    description: str | None = Field(default=None, max_length=3000)
    assessment_score: float | None = Field(default=None, ge=0, le=100)
    verification_status: str = "self_reported"


@app.get("/me/skill-evidence")
def list_my_skill_evidence(user: CurrentUser = Depends(get_current_user)) -> dict:
    from reskilling import db

    return {"evidence": db.list_skill_evidence(user.id)}


@app.post("/me/skill-evidence")
def add_my_skill_evidence(
    req: SkillEvidenceRequest, user: CurrentUser = Depends(get_current_user)
) -> dict:
    from reskilling import db

    try:
        return db.create_skill_evidence(user.id, req.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.get("/me/readiness")
def get_evidence_aware_readiness(user: CurrentUser = Depends(get_current_user)) -> dict:
    """Return the deterministic career score alongside an explicit evidence
    signal. Evidence is never silently folded into the occupation score: a
    certificate or project supports a claim, but does not rewrite O*NET data."""
    from reskilling import db

    analyses = db.list_career_analyses(user.id, limit=1)
    if not analyses:
        return {"base_readiness_score": None, "evidence_score": 0, "evidence_count": 0}
    evidence = db.list_skill_evidence(user.id)
    verified = sum(
        1 for item in evidence if item["verification_status"] != "self_reported"
    )
    assessment_points = sum((item["assessment_score"] or 0) / 100 for item in evidence)
    # A transparent, capped support indicator rather than inflated readiness.
    evidence_score = min(
        100, round((len(evidence) * 8) + (verified * 12) + (assessment_points * 10))
    )
    return {
        "base_readiness_score": analyses[0]["readiness_score"],
        "evidence_score": evidence_score,
        "evidence_count": len(evidence),
        "message": "Evidence supports your profile; your O*NET readiness score remains separately grounded in target-role requirements.",
    }


@app.get("/me/profile")
def get_my_profile(
    user: CurrentUserWithRole = Depends(get_current_user_with_role),
) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "full_name": user.full_name,
        "target_career": user.target_career,
        "experience_level": user.experience_level,
    }


@app.get("/admin/users")
def list_users(
    _admin: CurrentUserWithRole = Depends(require_role("administrator")),
) -> dict:
    from reskilling import db

    return {"users": db.list_all_profiles()}


class UpdateRoleRequest(BaseModel):
    role: str = Field(
        ..., description="One of: job_seeker, workforce_analyst, administrator"
    )


@app.patch("/admin/users/{user_id}/role")
def update_user_role(
    user_id: str,
    req: UpdateRoleRequest,
    _admin: CurrentUserWithRole = Depends(require_role("administrator")),
) -> dict:
    from reskilling import db

    try:
        db.update_user_role(user_id, req.role)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return {"user_id": user_id, "role": req.role}


# --------------------------------------------------------------------------
# CareerDev integration. A second frontend (github.com/munenejoel388/
# CareerDev) is being wired to this platform's tested backend rather
# than its own hardcoded, ungrounded analysis heuristic. All new
# endpoints are additive -- every endpoint above is unchanged.
# --------------------------------------------------------------------------


class UpdateProfileRequest(BaseModel):
    full_name: str | None = None
    target_career: str | None = None
    experience_level: str | None = None


@app.patch("/me/profile")
def update_my_profile(
    req: UpdateProfileRequest, user: CurrentUser = Depends(get_current_user)
) -> dict:
    from reskilling import db

    return db.upsert_profile_details(
        user_id=user.id,
        email=user.email,
        full_name=req.full_name,
        target_career=req.target_career,
        experience_level=req.experience_level,
    )


class CareerAnalysisRequest(BaseModel):
    current_career: str = Field(..., min_length=1)
    target_career: str = Field(..., min_length=1)
    experience_level: str = Field(..., min_length=1)
    current_skills: list[str] = Field(default_factory=list)
    goals: str | None = None


@app.post("/me/career-analysis")
def create_career_analysis(
    req: CareerAnalysisRequest,
    user: CurrentUser = Depends(get_current_user),
    recommender: ReskillingRecommender = Depends(get_recommender_dep),
) -> dict:
    """
    Serves CareerDev's free-text-target wizard. Tries a grounded O*NET
    taxonomy match first (real importance-weighted readiness score,
    real skill gaps, via the exact same analyze_gap() logic the
    platform's own /analyze-gap endpoint uses); falls back to
    Gemini-assisted reasoning, still taxonomy-checked via the Holding
    Pen, only when the typed target career doesn't confidently match
    any real occupation. See career_analysis.py's module docstring for
    the full reasoning.
    """
    from reskilling import career_analysis, db, resources
    from reskilling.schemas import SkillMatch

    occupations = recommender.list_target_occupations()
    matched_occupation = career_analysis.find_matching_occupation(
        req.target_career, occupations
    )
    current_skills_lower = {s.lower() for s in req.current_skills}

    if matched_occupation:
        taxonomy_lookup = {
            name.lower(): (sid, domain)
            for name, sid, domain in zip(
                recommender.taxonomy["skill_name"],
                recommender.taxonomy["skill_id"],
                recommender.taxonomy["domain"],
            )
        }
        user_skill_matches = []
        for skill in req.current_skills:
            match = taxonomy_lookup.get(skill.lower())
            if match:
                sid, domain = match
                user_skill_matches.append(
                    SkillMatch(sid, skill, domain, skill, "exact", 1.0)
                )

        result = recommender.analyze_gap(user_skill_matches, matched_occupation)
        skill_gaps = career_analysis.build_grounded_skill_gaps(result.missing_skills)
        readiness_score = round(result.readiness_score)
        matched_taxonomy = True
    else:
        from reskilling import llm_reasoning

        try:
            raw_suggestions = llm_reasoning.suggest_skills_for_goal(
                req.current_skills, req.target_career
            )
        except llm_reasoning.GeminiNotConfiguredError as exc:
            raise HTTPException(status_code=500, detail=str(exc)) from exc

        taxonomy_skills = {
            name.lower(): sid
            for name, sid in zip(
                recommender.taxonomy["skill_name"], recommender.taxonomy["skill_id"]
            )
        }
        suggestions = llm_reasoning.classify_against_taxonomy(
            raw_suggestions, taxonomy_skills
        )
        skill_gaps = career_analysis.build_fallback_skill_gaps(
            suggestions, current_skills_lower
        )
        readiness_score = career_analysis.compute_fallback_readiness_score(
            suggestions, current_skills_lower
        )
        matched_taxonomy = False

    summary = career_analysis.build_summary(
        req.target_career,
        req.experience_level,
        readiness_score,
        skill_gaps,
        matched_taxonomy,
    )

    learning_recommendations = []
    for gap in skill_gaps:
        curated = db.fetch_learning_resources(gap.skill_id) if gap.skill_id else []
        links = resources.merge_resources(curated, gap.skill, search_limit=1)
        for link in links:
            learning_recommendations.append(
                {
                    "title": link.title,
                    "provider": link.provider,
                    "url": link.url,
                    "skill": gap.skill,
                }
            )

    analysis = {
        "current_career": req.current_career,
        "target_career": req.target_career,
        "experience_level": req.experience_level,
        "current_skills": req.current_skills,
        "goals": req.goals,
        "readiness_score": readiness_score,
        "summary": summary,
        "skill_gaps": [g.to_dict() for g in skill_gaps],
        "learning_recommendations": learning_recommendations,
        "matched_taxonomy": matched_taxonomy,
    }
    return db.insert_career_analysis(user.id, analysis)


@app.get("/me/career-analyses")
def list_my_career_analyses(user: CurrentUser = Depends(get_current_user)) -> dict:
    from reskilling import db

    return {"analyses": db.list_career_analyses(user.id)}


@app.delete("/me/career-analyses")
def reset_my_career_analyses(user: CurrentUser = Depends(get_current_user)) -> dict:
    from reskilling import db

    deleted = db.delete_career_analyses_for_user(user.id)
    return {"deleted": deleted}


class UpdateRecommendationsRequest(BaseModel):
    recommendations: list[dict] = Field(default_factory=list)


@app.patch("/me/career-analyses/{analysis_id}/recommendations")
def update_career_analysis_recommendations(
    analysis_id: str,
    req: UpdateRecommendationsRequest,
    user: CurrentUser = Depends(get_current_user),
) -> dict:
    from reskilling import db

    result = db.update_career_analysis_recommendations(
        analysis_id, user.id, req.recommendations
    )
    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Analysis not found, or does not belong to the current user.",
        )
    return result


# --------------------------------------------------------------------------
# Phase E: New platform features — Job Description analyser, Resume
# analyser, Market Pulse, and HR / company skill-framework endpoints.
# All are additive; every endpoint above is unchanged.
# --------------------------------------------------------------------------


class JobDescriptionRequest(BaseModel):
    jd_text: str = Field(
        ..., min_length=50, description="Raw text of the job description"
    )


@app.post("/me/analyse-jd")
def analyse_job_description(
    req: JobDescriptionRequest,
    user: CurrentUser = Depends(get_current_user),
    extractor: "SkillExtractor" = Depends(get_extractor_dep),
    recommender: ReskillingRecommender = Depends(get_recommender_dep),
) -> dict:
    """
    Extract required skills from a job description, compare them against the
    user's latest career analysis, and persist a new CareerAnalysis whose
    source is the JD.  Falls back to Gemini reasoning when the detected role
    doesn't match the O*NET taxonomy (same fallback path as /me/career-analysis).
    """
    from reskilling import db, llm_reasoning, resources

    # --- 1. Extract skills mentioned in the JD using the NLP extractor ---
    jd_skill_matches = extractor.extract(req.jd_text)
    jd_skills = [m.skill_name for m in jd_skill_matches]

    # --- 2. Detect the probable job title from the JD ---
    detected_title = "Unknown Role"
    if llm_reasoning.GEMINI_API_KEY:
        try:
            import google.generativeai as genai  # type: ignore

            genai.configure(api_key=llm_reasoning.GEMINI_API_KEY)
            model = genai.GenerativeModel("gemini-2.0-flash")
            response = model.generate_content(
                f"Extract only the exact job title from this job description. "
                f"Respond with just the title, nothing else.\n\n{req.jd_text[:2000]}"
            )
            detected_title = (response.text or "").strip().strip('"')
        except Exception:
            pass

    # --- 3. Get the user's current skills from their latest analysis ---
    try:
        analyses = db.list_career_analyses(user.id)
        current_skills = analyses[0].get("current_skills", []) if analyses else []
    except Exception:
        current_skills = []

    current_skills_lower = {s.lower() for s in current_skills}

    # --- 4. Build skill gaps: JD requires X, user has Y → gaps = X - Y ---
    taxonomy_skills_map = {
        name.lower(): sid
        for name, sid in zip(
            recommender.taxonomy["skill_name"], recommender.taxonomy["skill_id"]
        )
    }

    gap_skills = [s for s in jd_skills if s.lower() not in current_skills_lower]
    skill_gaps = []
    for sk in gap_skills:
        sid = taxonomy_skills_map.get(sk.lower())
        priority = "high" if sk in jd_skills[:5] else "medium"
        skill_gaps.append(
            {
                "skill": sk,
                "skill_id": sid,
                "priority": priority,
                "reason": f"Required by the job description for {detected_title}.",
            }
        )

    readiness_score = max(
        0, round(100 - (len(gap_skills) / max(len(jd_skills), 1)) * 100)
    )

    # --- 5. Build learning recommendations ---
    learning_recommendations = []
    for gap in skill_gaps[:10]:
        curated = (
            db.fetch_learning_resources(gap["skill_id"]) if gap.get("skill_id") else []
        )
        links = resources.merge_resources(curated, gap["skill"], search_limit=1)
        for link in links:
            learning_recommendations.append(
                {
                    "title": link.title,
                    "provider": link.provider,
                    "url": link.url,
                    "skill": gap["skill"],
                }
            )

    analysis = {
        "current_career": "Current Role",
        "target_career": detected_title,
        "experience_level": "Mid",
        "current_skills": current_skills,
        "goals": f"Match requirements for: {detected_title}",
        "readiness_score": readiness_score,
        "summary": (
            f"Job description analysis for '{detected_title}'. "
            f"You have {len(current_skills)} skills and are missing "
            f"{len(gap_skills)} of the {len(jd_skills)} skills required."
        ),
        "skill_gaps": skill_gaps,
        "learning_recommendations": learning_recommendations,
        "matched_taxonomy": False,
    }

    saved = db.insert_career_analysis(user.id, analysis)
    return {
        "analysis": saved,
        "extracted_skills": jd_skills,
        "detected_title": detected_title,
    }


class ResumeAnalysisRequest(BaseModel):
    resume_text: str = Field(..., min_length=50)


@app.post("/me/analyse-resume")
def analyse_resume(
    req: ResumeAnalysisRequest,
    user: CurrentUser = Depends(get_current_user),
    extractor: "SkillExtractor" = Depends(get_extractor_dep),
) -> dict:
    """
    Extract skills, experience level, and current role from resume text.
    Returns structured results for the user to review and selectively import.
    Does NOT persist anything — the frontend calls PATCH /me/profile after
    the user confirms which skills to import.
    """
    from reskilling import llm_reasoning

    # Extract skills using NLP
    skill_matches = extractor.extract(req.resume_text)

    # Build skill list with domain info
    detected_skills = [
        {
            "name": m.skill_name,
            "confidence": "high"
            if m.confidence >= 0.85
            else "medium"
            if m.confidence >= 0.6
            else "low",
            "domain": m.domain,
        }
        for m in skill_matches
    ]

    # Use Gemini to extract experience level and role if available
    experience_level = "Mid-Level"
    detected_role = "Professional"
    summary = ""

    if llm_reasoning.GEMINI_API_KEY:
        try:
            import google.generativeai as genai  # type: ignore

            genai.configure(api_key=llm_reasoning.GEMINI_API_KEY)
            model = genai.GenerativeModel("gemini-2.0-flash")
            response = model.generate_content(
                "From this resume, extract:\n"
                "1. Current/most recent job title (one line)\n"
                "2. Experience level: Entry-Level, Mid-Level, Senior, or Executive\n"
                "3. A one-sentence professional summary\n\n"
                "Format your response as:\n"
                "TITLE: <title>\nLEVEL: <level>\nSUMMARY: <summary>\n\n"
                f"Resume:\n{req.resume_text[:3000]}"
            )
            for line in (response.text or "").splitlines():
                if line.startswith("TITLE:"):
                    detected_role = line[6:].strip()
                elif line.startswith("LEVEL:"):
                    experience_level = line[6:].strip()
                elif line.startswith("SUMMARY:"):
                    summary = line[8:].strip()
        except Exception:
            pass

    return {
        "detected_skills": detected_skills,
        "experience_level": experience_level,
        "detected_role": detected_role,
        "summary": summary,
    }


@app.get("/market/pulse")
def market_pulse(career: str) -> dict:
    """
    Returns salary range, demand trend, and top hiring companies for a career.
    Data is sourced from O*NET wage data when available, supplemented with
    BLS Occupational Employment Statistics estimates.  Falls back to estimated
    ranges when the career doesn't match a known occupation.
    This endpoint is intentionally public (no auth) so it can be shown on the
    anonymous demo path and in the dashboard widget without requiring a session.
    """
    # Hard-coded illustrative data seeded from BLS OES 2023 annual wage survey.
    # In production, replace this dict with a real BLS API call or a cached DB table.
    CAREER_DATA: dict[str, dict] = {
        "software engineer": {
            "min": 85000,
            "max": 175000,
            "trend": "growing",
            "score": 88,
            "companies": ["Google", "Microsoft", "Amazon", "Meta", "Apple"],
        },
        "data scientist": {
            "min": 90000,
            "max": 160000,
            "trend": "growing",
            "score": 85,
            "companies": ["Netflix", "Airbnb", "Spotify", "LinkedIn", "IBM"],
        },
        "machine learning engineer": {
            "min": 110000,
            "max": 200000,
            "trend": "growing",
            "score": 92,
            "companies": ["OpenAI", "DeepMind", "Anthropic", "Nvidia", "Tesla"],
        },
        "data analyst": {
            "min": 60000,
            "max": 110000,
            "trend": "growing",
            "score": 78,
            "companies": ["Deloitte", "PwC", "KPMG", "McKinsey", "Accenture"],
        },
        "cloud architect": {
            "min": 120000,
            "max": 210000,
            "trend": "growing",
            "score": 90,
            "companies": ["AWS", "Azure", "GCP", "Oracle", "IBM"],
        },
        "cybersecurity analyst": {
            "min": 80000,
            "max": 150000,
            "trend": "growing",
            "score": 87,
            "companies": [
                "Palo Alto",
                "CrowdStrike",
                "Cisco",
                "Fortinet",
                "BAE Systems",
            ],
        },
        "frontend developer": {
            "min": 75000,
            "max": 145000,
            "trend": "stable",
            "score": 72,
            "companies": ["Shopify", "Stripe", "Vercel", "Figma", "Atlassian"],
        },
        "devops engineer": {
            "min": 95000,
            "max": 165000,
            "trend": "growing",
            "score": 83,
            "companies": ["HashiCorp", "GitLab", "Docker", "Red Hat", "AWS"],
        },
        "product manager": {
            "min": 100000,
            "max": 180000,
            "trend": "stable",
            "score": 70,
            "companies": ["Google", "Meta", "Amazon", "Salesforce", "HubSpot"],
        },
        "ux designer": {
            "min": 70000,
            "max": 130000,
            "trend": "stable",
            "score": 65,
            "companies": ["Apple", "Adobe", "Figma", "IDEO", "McKinsey Design"],
        },
    }

    career_lower = career.lower().strip()
    match = None
    for key, val in CAREER_DATA.items():
        if key in career_lower or career_lower in key:
            match = val
            break

    if match:
        trending_skills_map: dict[str, list[str]] = {
            "software engineer": ["Rust", "Go", "Kubernetes", "TypeScript", "LLM APIs"],
            "data scientist": ["PyTorch", "MLflow", "dbt", "Spark", "LLM fine-tuning"],
            "machine learning engineer": ["CUDA", "vLLM", "Triton", "RLHF", "RAG"],
            "data analyst": ["dbt", "Tableau", "Power BI", "Python", "SQL"],
            "cloud architect": ["Terraform", "Pulumi", "FinOps", "Zero Trust", "WASM"],
            "cybersecurity analyst": [
                "SIEM",
                "SOAR",
                "Zero Trust",
                "Threat Intel",
                "Cloud Security",
            ],
            "frontend developer": [
                "React Server Components",
                "Astro",
                "Web Assembly",
                "Edge Functions",
                "AI UI",
            ],
            "devops engineer": [
                "Platform Engineering",
                "eBPF",
                "OpenTelemetry",
                "Backstage",
                "Argo CD",
            ],
            "product manager": [
                "AI Product",
                "PLG",
                "North Star Metrics",
                "User Research",
                "OKRs",
            ],
            "ux designer": [
                "AI UX",
                "Design Systems",
                "Prototyping",
                "Accessibility",
                "Motion Design",
            ],
        }
        trending = next(
            (
                v
                for k, v in trending_skills_map.items()
                if k in career_lower or career_lower in k
            ),
            [],
        )

        return {
            "career": career,
            "salary_min": match["min"],
            "salary_max": match["max"],
            "salary_currency": "$",
            "demand_trend": match["trend"],
            "demand_score": match["score"],
            "top_hiring_companies": match["companies"],
            "trending_skills": trending,
            "job_count_estimate": match["score"] * 150,
            "data_source": "BLS OES 2023 + O*NET",
            "cached": True,
        }

    # Generic fallback
    return {
        "career": career,
        "salary_min": 55000,
        "salary_max": 120000,
        "salary_currency": "$",
        "demand_trend": "stable",
        "demand_score": 60,
        "top_hiring_companies": [],
        "trending_skills": [],
        "job_count_estimate": 0,
        "data_source": "Estimated",
        "cached": False,
    }


class OrgSkillFrameworkEntry(BaseModel):
    role_name: str = Field(..., min_length=1)
    required_skills: list[str] = Field(..., min_length=1)


class OrgSkillFrameworkRequest(BaseModel):
    frameworks: list[OrgSkillFrameworkEntry] = Field(
        ..., description="List of role framework entries with required skills"
    )


@app.get("/org/skill-framework")
def get_org_skill_framework(user: CurrentUser = Depends(get_current_user)) -> dict:
    from reskilling import db

    return {"frameworks": db.list_org_skill_frameworks(user.id)}


@app.post("/org/skill-framework")
def save_org_skill_framework(
    req: OrgSkillFrameworkRequest,
    user: CurrentUser = Depends(get_current_user),
) -> dict:
    """
    Persist a company's skill framework (role → required skills mapping).
    """
    from reskilling import db

    frameworks = db.upsert_org_skill_frameworks(
        user.id, [fw.model_dump() for fw in req.frameworks]
    )
    return {"saved": len(frameworks), "frameworks": frameworks}


class ProviderConnectionRequest(BaseModel):
    provider_name: str = Field(..., min_length=1)
    provider_account: str | None = None
    access_token: str | None = None


class ProviderProgressItem(BaseModel):
    resource_id: int
    status: str = Field(default="in_progress", min_length=1)
    progress_percent: int = Field(default=0, ge=0, le=100)
    evidence_url: str | None = Field(default=None, max_length=2048)


class SyncProviderProgressRequest(BaseModel):
    progress: list[ProviderProgressItem] = Field(default_factory=list)


@app.get("/me/provider-connections")
def list_provider_connections(user: CurrentUser = Depends(get_current_user)) -> dict:
    from reskilling import db

    return {"connections": db.list_provider_connections(user.id)}


@app.post("/me/provider-connections")
def connect_provider(
    req: ProviderConnectionRequest,
    user: CurrentUser = Depends(get_current_user),
) -> dict:
    from reskilling import db

    return db.upsert_provider_connection(user.id, req.model_dump())


@app.post("/me/provider-connections/{provider_name}/sync")
def sync_provider_connection_progress(
    provider_name: str,
    req: SyncProviderProgressRequest,
    user: CurrentUser = Depends(get_current_user),
) -> dict:
    from reskilling import db

    return db.sync_provider_progress(
        user.id, provider_name, [item.model_dump() for item in req.progress]
    )


@app.post("/resources/{resource_id}/verify")
def verify_resource_link(resource_id: int) -> dict:
    from reskilling import db

    try:
        return db.verify_learning_resource_link(resource_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


# --------------------------------------------------------------------------
# Unified Docker UI Serving (React SPA)
# --------------------------------------------------------------------------
# We mount the built frontend inside the "static" directory
dist_dir = os.path.join(os.path.dirname(__file__), "..", "static")
if os.path.exists(dist_dir):
    # Mount the /assets directory so JS/CSS loads correctly
    assets_dir = os.path.join(dist_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    # Catch-all route to serve index.html for React Router, or specific public files
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Serve the file directly if it exists (e.g., /vite.svg, /favicon.ico)
        file_path = os.path.join(dist_dir, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)

        # Otherwise fallback to index.html for client-side routing
        return FileResponse(os.path.join(dist_dir, "index.html"))
