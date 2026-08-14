"""
test_recommender.py

Unit tests for ReskillingRecommender. Deliberately does NOT load spaCy
or the real taxonomy CSV -- recommender.py was designed decoupled from
the extraction layer specifically so it could be tested this way. We
build a small synthetic taxonomy DataFrame in memory and hand-construct
SkillMatch objects to stand in for extractor output.

Run with: pytest tests/test_recommender.py -v
"""

from __future__ import annotations

import pandas as pd
import pytest

from reskilling.recommender import ReskillingRecommender
from reskilling.schemas import SkillMatch


@pytest.fixture
def synthetic_taxonomy(tmp_path):
    """
    A tiny, hand-built taxonomy: one target occupation ("Data Analyst")
    requiring four skills at varying importance, plus one unrelated
    occupation to confirm filtering by occupation_title works.
    """
    rows = [
        # Data Analyst requirements
        {
            "skill_id": "SKL_001", "skill_name": "Python", "cluster": "Python",
            "domain": "Technology", "source": "technology",
            "onet_element_id": "T1", "onet_soc_code": "15-0000",
            "occupation_title": "Data Analyst", "importance": 4.8,
        },
        {
            "skill_id": "SKL_002", "skill_name": "SQL", "cluster": "SQL",
            "domain": "Technology", "source": "technology",
            "onet_element_id": "T2", "onet_soc_code": "15-0000",
            "occupation_title": "Data Analyst", "importance": 4.5,
        },
        {
            "skill_id": "SKL_003", "skill_name": "Critical Thinking",
            "cluster": "Critical Thinking", "domain": "Data & Analytics",
            "source": "general", "onet_element_id": "G1",
            "onet_soc_code": "15-0000", "occupation_title": "Data Analyst",
            "importance": 4.2,
        },
        {
            # importance 2.5 is below MIN_GAP_IMPORTANCE — excluded from gaps
            "skill_id": "SKL_004", "skill_name": "Public Speaking",
            "cluster": "Public Speaking", "domain": "Communication",
            "source": "general", "onet_element_id": "G2",
            "onet_soc_code": "15-0000", "occupation_title": "Data Analyst",
            "importance": 2.5,
        },
        # Unrelated occupation -- must never leak into Data Analyst results
        {
            "skill_id": "SKL_005", "skill_name": "Welding", "cluster": "Welding",
            "domain": "Trade", "source": "general", "onet_element_id": "G3",
            "onet_soc_code": "47-0000", "occupation_title": "Welder",
            "importance": 4.9,
        },
    ]
    df = pd.DataFrame(rows)
    csv_path = tmp_path / "synthetic_taxonomy.csv"
    df.to_csv(csv_path, index=False)
    return csv_path


@pytest.fixture
def recommender(synthetic_taxonomy):
    return ReskillingRecommender(taxonomy_path=synthetic_taxonomy)


def _fake_match(skill_id: str, skill_name: str, domain: str) -> SkillMatch:
    return SkillMatch(
        skill_id=skill_id,
        skill_name=skill_name,
        domain=domain,
        matched_text=skill_name,
        method="exact",
        confidence=1.0,
    )


class TestListTargetOccupations:
    def test_returns_unique_sorted_titles(self, recommender):
        result = recommender.list_target_occupations()
        assert result == ["Data Analyst", "Welder"]


class TestAnalyzeGap:
    def test_unknown_occupation_raises(self, recommender):
        with pytest.raises(ValueError):
            recommender.analyze_gap([], "Astronaut")

    def test_no_user_skills_means_everything_is_a_gap(self, recommender):
        result = recommender.analyze_gap([], "Data Analyst")
        assert len(result.matched_skills) == 0
        # Public Speaking (2.5) is below MIN_GAP_IMPORTANCE (3.0) -- excluded
        gap_names = {g.skill_name for g in result.missing_skills}
        assert gap_names == {"Python", "SQL", "Critical Thinking"}
        assert result.readiness_score == 0.0

    def test_partial_match_computes_weighted_not_flat_score(self, recommender):
        # User has Python (4.8) and SQL (4.5) out of all four required
        # skills. A flat 2/4 count would be 50%. Weighted by importance
        # over ALL four listed skills (including the sub-threshold one)
        # it should be (4.8+4.5) / (4.8+4.5+4.2+2.5) = 9.3/16.0 = 58.1%.
        user_skills = [
            _fake_match("SKL_001", "Python", "Technology"),
            _fake_match("SKL_002", "SQL", "Technology"),
        ]
        result = recommender.analyze_gap(user_skills, "Data Analyst")
        assert result.readiness_score == pytest.approx(58.1, abs=0.1)

    def test_missing_skills_sorted_by_importance_descending(self, recommender):
        result = recommender.analyze_gap([], "Data Analyst")
        importances = [g.importance for g in result.missing_skills]
        assert importances == sorted(importances, reverse=True)

    def test_low_importance_skill_excluded_from_gaps(self, recommender):
        result = recommender.analyze_gap([], "Data Analyst")
        gap_names = {g.skill_name for g in result.missing_skills}
        assert "Public Speaking" not in gap_names  # importance 2.5 < threshold

    def test_full_match_gives_full_readiness(self, recommender):
        user_skills = [
            _fake_match("SKL_001", "Python", "Technology"),
            _fake_match("SKL_002", "SQL", "Technology"),
            _fake_match("SKL_003", "Critical Thinking", "Data & Analytics"),
            _fake_match("SKL_004", "Public Speaking", "Communication"),
        ]
        result = recommender.analyze_gap(user_skills, "Data Analyst")
        assert result.readiness_score == 100.0
        assert len(result.missing_skills) == 0

    def test_unrelated_occupation_skills_do_not_count_as_matches(self, recommender):
        # User claims "Welding" -- irrelevant to Data Analyst, must not
        # affect the Data Analyst gap analysis in any way.
        user_skills = [_fake_match("SKL_005", "Welding", "Trade")]
        result = recommender.analyze_gap(user_skills, "Data Analyst")
        assert len(result.matched_skills) == 0
        assert result.readiness_score == 0.0

    def test_summary_dict_shape(self, recommender):
        user_skills = [_fake_match("SKL_001", "Python", "Technology")]
        result = recommender.analyze_gap(user_skills, "Data Analyst")
        summary = result.to_summary_dict()
        assert summary["occupation_title"] == "Data Analyst"
        assert summary["matched_count"] == 1
        assert "top_gaps" in summary
        assert len(summary["top_gaps"]) <= 5
