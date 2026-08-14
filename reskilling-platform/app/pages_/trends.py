"""
trends.py

Page 3. Now calls /taxonomy/requirements and /occupations on the API
instead of reaching into recommender.get_requirements_for() directly.
"""

from __future__ import annotations

import pandas as pd
import streamlit as st

from api_client import get_requirements_for, list_occupations


def render() -> None:
    st.header("Labour market trends")
    st.caption(
        "Live wage and employment-trend enrichment (BLS OEWS, ILOSTAT) is "
        "scoped for v1.1 \u2014 see the Labour Market Data Sources Catalogue. "
        "This view currently reflects O*NET-derived skill importance data."
    )

    occupations = list_occupations()
    selected = st.selectbox("Explore an occupation", occupations)

    requirements = pd.DataFrame(get_requirements_for(selected)).sort_values(
        "importance", ascending=False
    )

    st.subheader(f"Top skills for {selected}")
    st.dataframe(
        requirements[["skill_name", "domain", "source", "importance"]],
        use_container_width=True,
        hide_index=True,
    )
