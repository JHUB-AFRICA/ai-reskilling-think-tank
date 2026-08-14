"""
dashboard.py

Page 1: landing page / overview. Now calls the FastAPI service's
/taxonomy/stats endpoint instead of reaching into
get_recommender().taxonomy directly -- this is the Phase A validation
migration: every page goes through the API, proving it is a faithful
wrapper over the tested core rather than a parallel, divergent path.
"""

from __future__ import annotations

import pandas as pd
import streamlit as st

from api_client import get_taxonomy_stats


def render() -> None:
    st.header("Workforce readiness dashboard")
    st.write(
        "An overview of the platform's skills taxonomy coverage. "
        "Upload your resume to get a personalized readiness score."
    )

    stats = get_taxonomy_stats()

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Occupations covered", stats["occupation_count"])
    c2.metric("Unique skills tracked", stats["skill_count"])
    c3.metric("Domains", stats["domain_count"])
    c4.metric("Technology-specific skills", stats["technology_skill_count"])

    st.subheader("Skills by domain")
    domain_counts = pd.Series(stats["domain_distribution"]).sort_values(ascending=True)
    st.bar_chart(domain_counts)

    if st.session_state["gap_result"]:
        st.subheader("Your latest readiness check")
        result = st.session_state["gap_result"]
        st.metric(f"Readiness for {result.occupation_title}", f"{result.readiness_score}%")
    else:
        st.info("No readiness check yet \u2014 visit **Upload resume** to get started.")
