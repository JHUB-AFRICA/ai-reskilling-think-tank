"""
streamlit_app.py

Entry point. Owns sidebar navigation, one-time session state
initialization, and an API connectivity check -- never business logic.
Each page is a separate function imported from app/pages_/, kept thin
and calling the FastAPI service (via api_client.py) for everything
substantive, rather than importing src/reskilling/ directly. This is
the Phase A validation architecture: this file, and every page under
pages_/, now has zero direct dependency on src/reskilling/ -- all of
it goes through the HTTP API in app_api/main.py.
"""

from __future__ import annotations

import os

import streamlit as st

from api_client import health_check
from pages_ import dashboard, lrs_viewer, pathway, trends, upload_resume

st.set_page_config(
    page_title="AI Reskilling Think Tank Platform",
    page_icon=":compass:",
    layout="wide",
)

DEFAULTS = {
    "resume_text": "",
    "user_skills": [],
    "target_occupation": None,
    "gap_result": None,
    "xapi_actor_email": "demo@example.com",
}
for key, value in DEFAULTS.items():
    if key not in st.session_state:
        st.session_state[key] = value

PAGES = {
    "Workforce readiness dashboard": dashboard.render,
    "Upload resume": upload_resume.render,
    "Labour market trends": trends.render,
    "My reskilling pathway": pathway.render,
    "Learning Record Store": lrs_viewer.render,
}

with st.sidebar:
    st.title("Reskilling Platform")
    st.caption("AI-driven skills gap analysis and pathway recommendations")

    selection = st.radio("Navigate", list(PAGES.keys()), label_visibility="collapsed")

    st.divider()
    st.session_state["xapi_actor_email"] = st.text_input(
        "Session identifier (for tracking)",
        value=st.session_state["xapi_actor_email"],
        help="Used to attribute xAPI competency-tracking statements to this session.",
    )

if not health_check():
    api_url = os.environ.get("RESKILLING_API_URL", "http://localhost:8000")
    st.error(
        f"Cannot reach the platform API at {api_url}. "
        "Start it with: uvicorn app_api.main:app --reload"
    )
    st.stop()

PAGES[selection]()
