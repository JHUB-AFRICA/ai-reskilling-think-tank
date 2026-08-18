"""
recommender.py

Skills-gap analysis and reskilling pathway recommendation engine.

Takes the output of nlp.SkillExtractor (skills found in a resume) and
compares it against the taxonomy's requirements for a target occupation,
producing:
    - matched skills (already held)
    - missing skills (gap), ranked by importance
    - a single weighted readiness score for dashboard display

Design note: this module deliberately does not call spaCy directly --
it operates purely on SkillMatch / DataFrame inputs, so it can be unit
tested without loading a language model, and so the recommendation
logic stays decoupled from the extraction method (Phase 2's NLP layer
could later be swapped for a different extractor without touching this
file at all).
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from pathlib import Path

import pandas as pd

from reskilling.schemas import SkillMatch

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s"
)
logger = logging.getLogger(__name__)

TAXONOMY_PATH = Path("data/processed/skills_taxonomy_v1.csv")

# Importance scores below this aren't worth surfacing as "gaps" --
# matches the same threshold philosophy as taxonomy.py's ingestion
# filter, kept here as a separate constant since this is a presentation
# concern (what to show the user), not a data-quality concern.
MIN_GAP_IMPORTANCE = 3.0


@dataclass
class SkillGap:
    skill_id: str
    skill_name: str
    domain: str
    importance: float


@dataclass
class GapAnalysisResult:
    occupation_title: str
    matched_skills: list[SkillMatch] = field(default_factory=list)
    missing_skills: list[SkillGap] = field(default_factory=list)
    readiness_score: float = 0.0  # 0-100

    def to_summary_dict(self) -> dict:
        """Flat dict -- convenient for Streamlit display and for logging
        an xAPI statement in lrs.py without that module needing to know
        about this module's internal dataclasses."""
        return {
            "occupation_title": self.occupation_title,
            "readiness_score": self.readiness_score,
            "matched_count": len(self.matched_skills),
            "missing_count": len(self.missing_skills),
            "top_gaps": [g.skill_name for g in self.missing_skills[:5]],
        }


class ReskillingRecommender:
    """
    Mirrors SkillExtractor's pattern: expensive setup (loading the
    taxonomy) happens once in __init__, cheap per-request work happens
    in analyze_gap(). Instantiate once per Streamlit session.
    """

    def __init__(self, taxonomy_path: Path = TAXONOMY_PATH) -> None:
        logger.info("Loading taxonomy for recommender from %s", taxonomy_path)
        self.taxonomy = pd.read_csv(taxonomy_path)

        occupations = sorted(
            self.taxonomy["occupation_title"].dropna().unique().tolist()
        )
        logger.info(
            "Recommender ready: %d occupations available as targets", len(occupations)
        )

    def list_target_occupations(self) -> list[str]:
        """Powers the Streamlit dropdown for 'target job' selection."""
        return sorted(self.taxonomy["occupation_title"].dropna().unique().tolist())

    def get_requirements_for(self, occupation_title: str):
        """
        Public accessor for an occupation's full skill requirement rows
        (deduplicated by skill_name), sorted by importance descending.
        Exists so UI code (e.g. the Trends page) doesn't reach into the
        private _requirements_for() helper, which is reserved for this
        class's own internal use in analyze_gap().
        """
        return (
            self._requirements_for(occupation_title)
            .drop_duplicates(subset=["skill_name"])
            .sort_values("importance", ascending=False)
        )

    def _requirements_for(self, occupation_title: str) -> pd.DataFrame:
        rows = self.taxonomy[self.taxonomy["occupation_title"] == occupation_title]
        if rows.empty:
            raise ValueError(
                f"No taxonomy rows found for occupation_title='{occupation_title}'. "
                "Use list_target_occupations() to get a valid value."
            )
        return rows

    def analyze_gap(
        self, user_skills: list[SkillMatch], target_occupation: str
    ) -> GapAnalysisResult:
        requirements = self._requirements_for(target_occupation)
        required_ids = set(requirements["skill_id"])
        user_skill_ids = {s.skill_id for s in user_skills}

        matched = [s for s in user_skills if s.skill_id in required_ids]

        missing_rows = requirements[
            (~requirements["skill_id"].isin(user_skill_ids))
            & (requirements["importance"] >= MIN_GAP_IMPORTANCE)
        ].drop_duplicates(subset=["skill_id"])

        missing = [
            SkillGap(
                skill_id=row.skill_id,
                skill_name=row.skill_name,
                domain=row.domain,
                importance=row.importance,
            )
            for row in missing_rows.itertuples()
        ]
        missing.sort(key=lambda g: g.importance, reverse=True)

        readiness_score = self._compute_readiness(requirements, matched, required_ids)

        logger.info(
            "Gap analysis for '%s': %d matched, %d missing, readiness=%.1f",
            target_occupation,
            len(matched),
            len(missing),
            readiness_score,
        )

        return GapAnalysisResult(
            occupation_title=target_occupation,
            matched_skills=matched,
            missing_skills=missing,
            readiness_score=readiness_score,
        )

    @staticmethod
    def _compute_readiness(
        requirements: pd.DataFrame, matched: list[SkillMatch], required_ids: set[str]
    ) -> float:
        """
        Importance-weighted readiness score, not a flat skill-count
        percentage. Rationale: if a target occupation requires 10
        skills and the user has 8 low-importance ones but is missing
        the 2 most critical, a flat "80% match" badly overstates
        readiness. Weighting by importance corrects for this.
        """
        dedup_requirements = requirements.drop_duplicates(subset=["skill_id"])
        total_weight = dedup_requirements["importance"].sum()
        if total_weight == 0:
            return 0.0

        matched_ids = {s.skill_id for s in matched}
        matched_weight = dedup_requirements[
            dedup_requirements["skill_id"].isin(matched_ids)
        ]["importance"].sum()

        return round(float(matched_weight / total_weight) * 100, 1)


if __name__ == "__main__":
    from reskilling.nlp import SkillExtractor

    extractor = SkillExtractor()
    recommender = ReskillingRecommender()

    sample_resume = (
        "Built ML pipelines using PyTorch and deployed them on AWS. "
        "Strong background in data analysis and active listening during "
        "client meetings. Proficient in Python and SQL."
    )
    user_skills = extractor.extract(sample_resume)

    occupations = recommender.list_target_occupations()
    target = next((o for o in occupations if "Data Scientist" in o), occupations[0])

    result = recommender.analyze_gap(user_skills, target)
    print(f"\nTarget: {result.occupation_title}")
    print(f"Readiness score: {result.readiness_score}%")
    print(f"\nMatched ({len(result.matched_skills)}):")
    for s in result.matched_skills:
        print(f"  - {s.skill_name}")
    print(f"\nTop gaps ({len(result.missing_skills)} total):")
    for g in result.missing_skills[:5]:
        print(f"  - {g.skill_name} (importance {g.importance})")
