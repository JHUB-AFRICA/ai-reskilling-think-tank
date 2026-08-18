"""
career_analysis.py

Serves CareerDev's free-text "target career" wizard input, which
cannot go through the strict, dropdown-driven /analyze-gap flow (that
requires an exact O*NET occupation title match, by design -- see
recommender.py). Free text like "AI Engineer" or "Frontend Developer"
will often not literally match any of O*NET's ~1,000 formal titles
(e.g. "Data Scientists," "Software Developers") even when the intent
is clear to a person.

This module tries a grounded taxonomy match first (deterministic, real
importance-weighted readiness score, real skill gaps) and only falls
back to Gemini reasoning when no confident match exists -- the same
deterministic-first, probabilistic-fallback principle used throughout
this project (nlp.py's PhraseMatcher-then-embedding design, and the
Emerging Skill Holding Pen in llm_reasoning.py). The fallback path's
readiness score is still grounded in real overlap between the user's
stated skills and the taxonomy-checked suggestions -- never an LLM's
own invented percentage.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

# Below this word-overlap ratio, a free-text target career is not
# treated as a confident taxonomy match. Chosen conservatively for the
# same reason nlp.py's embedding threshold is conservative: a false
# "grounded" match would present an ungrounded guess with false
# authority, which is worse than correctly falling back to the
# Gemini-assisted path.
MATCH_THRESHOLD = 0.6

_FILLER_WORDS = {"a", "an", "the", "and", "or", "of", "in", "for", "specialist", "professional"}


def _normalize_words(text: str) -> set[str]:
    words = re.findall(r"[a-z]+", text.lower())
    words = [w.rstrip("s") if len(w) > 3 else w for w in words]  # crude depluralization
    return {w for w in words if w not in _FILLER_WORDS and len(w) > 1}


def find_matching_occupation(target_career: str, occupations: list[str]) -> str | None:
    """
    Deterministic, no network/model call. Word-overlap scoring against
    every occupation title, returning the single best match if it
    clears MATCH_THRESHOLD, else None (signaling the caller to use the
    Gemini fallback path instead of asserting false confidence).
    """
    target_words = _normalize_words(target_career)
    if not target_words:
        return None

    best_match, best_score = None, 0.0
    for occupation in occupations:
        occ_words = _normalize_words(occupation)
        if not occ_words:
            continue
        overlap = target_words & occ_words
        score = len(overlap) / min(len(target_words), len(occ_words))
        if score > best_score:
            best_match, best_score = occupation, score

    return best_match if best_score >= MATCH_THRESHOLD else None


@dataclass
class SkillGapEntry:
    skill: str
    priority: str  # "low" | "medium" | "high"
    reason: str
    skill_id: str | None = None  # None for emerging (non-taxonomy) suggestions

    def to_dict(self) -> dict:
        return {"skill": self.skill, "priority": self.priority, "reason": self.reason, "skill_id": self.skill_id}


def priority_from_importance(importance: float) -> str:
    if importance >= 4.5:
        return "high"
    if importance >= 3.5:
        return "medium"
    return "low"


def build_grounded_skill_gaps(missing_skills: list) -> list[SkillGapEntry]:
    """missing_skills: list of recommender.SkillGap objects (skill_id, skill_name, importance)."""
    return [
        SkillGapEntry(
            skill=g.skill_name,
            priority=priority_from_importance(g.importance),
            reason=(
                f"Rated {g.importance}/5 importance for this occupation in O*NET labour "
                "market data -- a verified, real-world requirement, not a guess."
            ),
            skill_id=g.skill_id,
        )
        for g in missing_skills
    ]


def build_fallback_skill_gaps(suggestions: list, current_skills_lower: set[str]) -> list[SkillGapEntry]:
    """suggestions: list of llm_reasoning.SkillSuggestion objects, already
    classified as taxonomy_match/emerging. Only genuinely missing
    suggestions (not already in the user's stated skills) become gaps."""
    gaps = []
    for s in suggestions:
        if s.skill_name.lower() in current_skills_lower:
            continue
        if s.status == "taxonomy_match":
            gaps.append(
                SkillGapEntry(
                    skill=s.skill_name,
                    priority="medium",
                    reason=(
                        "Suggested for this goal and confirmed against the platform's "
                        "labour-market taxonomy."
                    ),
                    skill_id=s.matched_skill_id,
                )
            )
        else:
            gaps.append(
                SkillGapEntry(
                    skill=s.skill_name,
                    priority="low",
                    reason=(
                        "Suggested for this goal, but not yet in the platform's verified "
                        "taxonomy -- treat as a plausible lead worth researching further, "
                        "not a confirmed requirement."
                    ),
                    skill_id=None,
                )
            )
    return gaps


def compute_fallback_readiness_score(suggestions: list, current_skills_lower: set[str]) -> int:
    """
    Grounded in real overlap, never an LLM-invented number: what
    fraction of the suggested-relevant skills does the user already
    report having. Returns 0 (not 100) when there are no suggestions
    at all, since "no data" should never be scored as "fully ready."
    """
    if not suggestions:
        return 0
    matched = sum(1 for s in suggestions if s.skill_name.lower() in current_skills_lower)
    return round((matched / len(suggestions)) * 100)


def build_summary(
    target_career: str,
    experience_level: str,
    readiness_score: int,
    skill_gaps: list[SkillGapEntry],
    matched_taxonomy: bool,
) -> str:
    """Deterministic template, not LLM-generated -- avoids yet another
    hallucination surface for what is ultimately just a restatement of
    numbers already computed above."""
    top_gaps = ", ".join(g.skill for g in skill_gaps[:3]) or "no major gaps identified"
    grounding_note = (
        "based on verified O*NET labour-market data for this occupation"
        if matched_taxonomy
        else "based on AI-assisted suggestions for this goal, cross-checked against the "
        "platform's taxonomy where possible"
    )
    return (
        f"With {experience_level} experience, your readiness for {target_career} is "
        f"{readiness_score}%, {grounding_note}. "
        f"Priority areas to focus on: {top_gaps}."
    )
