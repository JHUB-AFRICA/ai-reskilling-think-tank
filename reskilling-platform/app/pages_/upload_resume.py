"""
upload_resume.py

Page 2. Now calls the FastAPI service's /extract-skills endpoint
instead of get_extractor().extract() locally. The API endpoint already
logs the xAPI "experienced" event server-side, so this page no longer
calls log_resume_upload_event() itself -- doing so would double-log.
"""

from __future__ import annotations

import streamlit as st

from api_client import extract_skills

SAMPLE_RESUME = (
    "Experienced analyst with a background in data analysis and Python. "
    "Built ML pipelines using PyTorch and deployed models on AWS. "
    "Comfortable with SQL for querying production databases. "
    "Strong active listening and critical thinking skills developed "
    "through years of client-facing consulting work."
)


def render() -> None:
    st.header("Upload your resume")
    st.write(
        "Paste your resume text below. We'll extract the skills our system "
        "recognizes against the platform's skills taxonomy."
    )

    col1, col2 = st.columns([3, 1])
    with col2:
        if st.button("Use sample resume", use_container_width=True):
            st.session_state["resume_text"] = SAMPLE_RESUME

    resume_text = st.text_area(
        "Resume text",
        value=st.session_state["resume_text"],
        height=220,
        placeholder="Paste your resume content here...",
        label_visibility="collapsed",
    )

    if st.button("Extract skills", type="primary"):
        if not resume_text.strip():
            st.warning("Paste resume text first, or use the sample resume.")
            return

        with st.spinner("Calling the extraction API..."):
            skills = extract_skills(resume_text)

        st.session_state["resume_text"] = resume_text
        st.session_state["user_skills"] = skills

        st.success(f"Extracted {len(skills)} skills.")

    if st.session_state["user_skills"]:
        st.subheader("Extracted skills")
        exact = [s for s in st.session_state["user_skills"] if s.method == "exact"]
        fuzzy = [s for s in st.session_state["user_skills"] if s.method == "embedding"]

        c1, c2 = st.columns(2)
        with c1:
            st.metric("Exact matches", len(exact))
        with c2:
            st.metric("Inferred matches", len(fuzzy))

        for skill in st.session_state["user_skills"]:
            badge = "exact" if skill.method == "exact" else f"inferred ({skill.confidence:.0%})"
            st.write(f"**{skill.skill_name}** \u2014 {skill.domain} \u00b7 _{badge}_")

        st.info("Go to **My reskilling pathway** to compare these skills against a target role.")
