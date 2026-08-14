"""
lrs_viewer.py

Page 5. Now calls the FastAPI service's /lrs/statements endpoint
instead of reading data/processed/xapi_statements.jsonl directly. This
is the last page migrated in the Phase A validation pass -- every page
now goes through the API, with no remaining direct filesystem or
in-process src/reskilling/ access from app/pages_/.
"""

from __future__ import annotations

import pandas as pd
import streamlit as st

from api_client import get_lrs_statements


def render() -> None:
    st.header("Learning Record Store")
    st.caption(
        "Raw xAPI statements recorded by this session, retrieved via the "
        "platform API. In a production deployment with a hosted LRS, this "
        "page would query the LRS's Statements API directly."
    )

    statements = get_lrs_statements()

    if not statements:
        st.info("No xAPI statements recorded yet \u2014 use the Upload resume or "
                 "My reskilling pathway pages to generate activity.")
        return

    rows = []
    for s in statements:
        rows.append({
            "timestamp": s["timestamp"],
            "actor": s["actor"]["mbox"].replace("mailto:", ""),
            "verb": s["verb"]["display"]["en-US"],
            "activity": s["object"]["definition"]["name"]["en-US"],
        })
    df = pd.DataFrame(rows).sort_values("timestamp", ascending=False)

    st.dataframe(df, use_container_width=True, hide_index=True)

    st.subheader("Inspect a raw statement")
    idx = st.selectbox(
        "Select a statement",
        range(len(statements)),
        format_func=lambda i: f"{rows[i]['timestamp']} \u2014 {rows[i]['activity']}",
    )
    st.json(statements[idx])
