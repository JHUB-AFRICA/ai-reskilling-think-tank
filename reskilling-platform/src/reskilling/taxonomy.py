"""
taxonomy.py

Builds the canonical Skills Taxonomy from raw O*NET database extracts.

Pipeline:
    Occupation Data.txt   -> occupation master list (O*NET-SOC code -> title)
    Skills.txt            -> generalized work skills, importance-weighted
    Technology Skills.txt -> specific tools/software per occupation

Output:
    data/processed/skills_taxonomy_v1.csv

Usage:
    python -m reskilling.taxonomy
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path

import pandas as pd

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger(__name__)

# --------------------------------------------------------------------------
# Configuration
# --------------------------------------------------------------------------

RAW_DIR = Path("data/raw/onet")
PROCESSED_DIR = Path("data/processed")
OUTPUT_PATH = PROCESSED_DIR / "skills_taxonomy_v1.csv"

# O*NET importance scale runs 1-5. Anything below this is noise for a
# reskilling use case -- e.g. "Active Listening" scored 1.2 for an
# occupation isn't a meaningful requirement.
MIN_IMPORTANCE_THRESHOLD = 3.0

# Coarse mapping from O*NET skill element names to a top-level domain.
# This is a starting heuristic -- expected to be refined manually once
# you eyeball the output. Anything unmapped falls into "General".
DOMAIN_MAP: dict[str, str] = {
    "Programming": "Technology",
    "Technology Design": "Technology",
    "Operations Analysis": "Technology",
    "Systems Analysis": "Technology",
    "Systems Evaluation": "Technology",
    "Complex Problem Solving": "Data & Analytics",
    "Mathematics": "Data & Analytics",
    "Active Learning": "Data & Analytics",
    "Critical Thinking": "Data & Analytics",
    "Judgment and Decision Making": "Data & Analytics",
    "Active Listening": "Communication",
    "Speaking": "Communication",
    "Writing": "Communication",
    "Reading Comprehension": "Communication",
    "Negotiation": "Communication",
    "Persuasion": "Communication",
    "Social Perceptiveness": "Communication",
    "Coordination": "Leadership",
    "Management of Personnel Resources": "Leadership",
    "Time Management": "Leadership",
    "Instructing": "Leadership",
    "Service Orientation": "Leadership",
}


@dataclass(frozen=True)
class TaxonomyRow:
    """A single skill-to-occupation taxonomy record."""

    skill_id: str
    skill_name: str
    cluster: str
    domain: str
    onet_element_id: str
    onet_soc_code: str
    occupation_title: str
    importance: float


# --------------------------------------------------------------------------
# Loaders
# --------------------------------------------------------------------------

def _read_onet_txt(filename: str) -> pd.DataFrame:
    """
    O*NET text files are tab-separated, UTF-8, with a header row.
    They're shipped with inconsistent trailing whitespace in some
    releases, so we strip column names defensively.
    """
    path = RAW_DIR / filename
    if not path.exists():
        raise FileNotFoundError(
            f"Expected O*NET file not found: {path}. "
            "Confirm data/raw/onet/ contains the extracted database files."
        )

    df = pd.read_csv(path, sep="\t", dtype=str, encoding="utf-8")
    df.columns = [c.strip() for c in df.columns]
    logger.info("Loaded %s (%d rows)", filename, len(df))
    return df


def load_occupations() -> pd.DataFrame:
    df = _read_onet_txt("Occupation Data.txt")
    return df[["O*NET-SOC Code", "Title"]].rename(
        columns={"O*NET-SOC Code": "onet_soc_code", "Title": "occupation_title"}
    )


def load_skills() -> pd.DataFrame:
    df = _read_onet_txt("Skills.txt")

    # O*NET stores three scale types per skill/occupation pair: IM
    # (Importance), LV (Level), and (in newer releases) NA flags.
    # We only want Importance for the taxonomy weighting.
    df = df[df["Scale ID"] == "IM"].copy()
    df["Data Value"] = pd.to_numeric(df["Data Value"], errors="coerce")

    return df[
        ["O*NET-SOC Code", "Element ID", "Element Name", "Data Value"]
    ].rename(
        columns={
            "O*NET-SOC Code": "onet_soc_code",
            "Element ID": "onet_element_id",
            "Element Name": "skill_name",
            "Data Value": "importance",
        }
    )


def load_technology_skills() -> pd.DataFrame:
    """
    Technology Skills.txt has no importance/level scale -- it's a flat
    list of "this occupation commonly uses this software/tool" facts,
    sourced from job postings rather than survey data. We assign it a
    fixed high importance (4.0) since presence in this file already
    signals relevance; there is no weaker/stronger signal to filter on.
    """
    df = _read_onet_txt("Technology Skills.txt")

    df = df.rename(
        columns={
            "O*NET-SOC Code": "onet_soc_code",
            "Workplace Example": "skill_name",
            "Element Name": "cluster_override",
        }
    )
    df = df.dropna(subset=["skill_name", "onet_soc_code"])
    df["importance"] = 4.0
    # Technology Skills has no stable numeric Element ID like Skills.txt --
    # we synthesize one from the skill name so downstream code can treat
    # it identically to a generalized skill row.
    df["onet_element_id"] = "TECH_" + df["skill_name"].str.upper().str.replace(
        r"[^A-Z0-9]+", "_", regex=True
    ).str.slice(0, 40)

    return df[
        ["onet_soc_code", "onet_element_id", "skill_name", "importance", "cluster_override"]
    ]


# --------------------------------------------------------------------------
# Transform
# --------------------------------------------------------------------------

def assign_domain(skill_name: str, source: str) -> str:
    if source == "technology":
        # Technology Skills entries are concrete software/tools -- these
        # always belong in Technology regardless of which O*NET
        # "Commodity Title" category they were filed under, since the
        # taxonomy's domain axis is about worker-facing skill category,
        # not internal O*NET product classification.
        return "Technology"
    return DOMAIN_MAP.get(skill_name, "General")


def build_taxonomy() -> pd.DataFrame:
    occupations = load_occupations()

    general_skills = load_skills()
    general_skills["source"] = "general"
    general_skills["cluster"] = general_skills["skill_name"]

    tech_skills = load_technology_skills()
    tech_skills["source"] = "technology"
    tech_skills["cluster"] = tech_skills["cluster_override"]
    tech_skills = tech_skills.drop(columns=["cluster_override"])

    logger.info(
        "Combining %d general skill rows with %d technology skill rows",
        len(general_skills),
        len(tech_skills),
    )
    combined_skills = pd.concat([general_skills, tech_skills], ignore_index=True)

    logger.info("Joining skills to occupations on O*NET-SOC code")
    merged = combined_skills.merge(occupations, on="onet_soc_code", how="left")

    before = len(merged)
    merged = merged.dropna(subset=["importance", "occupation_title"])
    merged = merged[merged["importance"] >= MIN_IMPORTANCE_THRESHOLD]
    logger.info(
        "Filtered low-importance / unmatched rows: %d -> %d (threshold=%.1f)",
        before,
        len(merged),
        MIN_IMPORTANCE_THRESHOLD,
    )

    merged["domain"] = merged.apply(
        lambda r: assign_domain(r["skill_name"], r["source"]), axis=1
    )
    merged["skill_id"] = (
        "SKL_" + merged["onet_element_id"].astype(str).str.replace(".", "", regex=False)
    )

    # A given skill_id can repeat across many occupations -- that's
    # expected and intentional. The taxonomy is occupation x skill,
    # not a deduplicated skill list. Deduplication for UI dropdowns
    # happens downstream, not here.
    ordered_cols = [
        "skill_id",
        "skill_name",
        "cluster",
        "domain",
        "source",
        "onet_element_id",
        "onet_soc_code",
        "occupation_title",
        "importance",
    ]
    result = merged[ordered_cols].sort_values(
        ["domain", "skill_name", "importance"], ascending=[True, True, False]
    )
    return result.reset_index(drop=True)


# --------------------------------------------------------------------------
# Entry point
# --------------------------------------------------------------------------

def main() -> None:
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    taxonomy = build_taxonomy()
    taxonomy.to_csv(OUTPUT_PATH, index=False)

    logger.info("Wrote %d rows to %s", len(taxonomy), OUTPUT_PATH)
    logger.info(
        "Unique skills: %d | Unique occupations: %d | Domains: %s",
        taxonomy["skill_name"].nunique(),
        taxonomy["occupation_title"].nunique(),
        sorted(taxonomy["domain"].unique().tolist()),
    )
    logger.info(
        "Source breakdown: %s",
        taxonomy["source"].value_counts().to_dict(),
    )


if __name__ == "__main__":
    main()
