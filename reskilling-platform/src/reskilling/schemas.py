"""
schemas.py

Shared, dependency-light data contracts used across the pipeline.

This module exists specifically to break a coupling problem: nlp.py
needs spaCy, but recommender.py only needs the *shape* of what nlp.py
produces (SkillMatch), not spaCy itself. Without this module,
recommender.py would have to `from reskilling.nlp import SkillMatch`,
which transitively forces spacy to be installed just to run gap-analysis
unit tests or import the recommender in a lightweight context (e.g. a
future API service that only does recommendation, not extraction).

Keep this module free of any heavy third-party imports. pandas/numpy
are acceptable; spacy, sentence-transformers, etc. are not.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class SkillMatch:
    """A single extracted skill, with provenance for auditability."""

    skill_id: str
    skill_name: str
    domain: str
    matched_text: str
    method: str  # "exact" or "embedding"
    confidence: float
