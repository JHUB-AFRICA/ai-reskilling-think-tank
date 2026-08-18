"""
migrate_taxonomy_to_postgres.py

One-time (re-runnable) data load: reads data/processed/skills_taxonomy_v1.csv
and populates the normalized occupations / skills / occupation_skills
tables created by db/migrations/001_create_taxonomy_tables.sql.

This is a data-loading task against an already-stable schema, not a
redesign -- exactly the framing in the Unified Platform Architecture
Proposal \u00a74.1: the taxonomy itself does not change, only where it lives.

Run with: python -m reskilling.migrate_taxonomy_to_postgres
Prerequisite: apply db/migrations/001 and 002 first, via the Supabase
SQL editor or `psql $DATABASE_URL -f db/migrations/001_create_taxonomy_tables.sql`.
"""

from __future__ import annotations

import logging
from pathlib import Path

import pandas as pd
from sqlalchemy import text

from reskilling.db import check_connection, get_engine

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

TAXONOMY_PATH = Path("data/processed/skills_taxonomy_v1.csv")


def load_and_migrate() -> None:
    if not check_connection():
        raise SystemExit(1)

    if not TAXONOMY_PATH.exists():
        raise FileNotFoundError(
            f"{TAXONOMY_PATH} not found -- run `python -m reskilling.taxonomy` first."
        )

    df = pd.read_csv(TAXONOMY_PATH)
    engine = get_engine()

    occupations = df[["onet_soc_code", "occupation_title"]].drop_duplicates(
        subset=["onet_soc_code"]
    )
    skills = df[["skill_id", "skill_name", "cluster", "domain", "source", "onet_element_id"]].drop_duplicates(
        subset=["skill_id"]
    )
    occupation_skills = df[["onet_soc_code", "skill_id", "importance"]].drop_duplicates()

    logger.info(
        "Migrating %d occupations, %d skills, %d occupation-skill rows",
        len(occupations),
        len(skills),
        len(occupation_skills),
    )

    with engine.begin() as conn:
        # Upsert semantics via a temp-table + ON CONFLICT pattern would be
        # more efficient at large scale; for this taxonomy's size (a few
        # thousand rows), a straightforward delete-then-insert inside a
        # single transaction is simpler, correct, and re-runnable.
        conn.execute(text("delete from occupation_skills"))
        conn.execute(text("delete from skills"))
        conn.execute(text("delete from occupations"))

        occupations.to_sql("occupations", conn, if_exists="append", index=False)
        skills.to_sql("skills", conn, if_exists="append", index=False)
        occupation_skills.to_sql("occupation_skills", conn, if_exists="append", index=False)

    logger.info("Migration complete.")


if __name__ == "__main__":
    load_and_migrate()
