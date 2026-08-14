"""
pathway.py

Page 4. Now calls the FastAPI service's /analyze-gap endpoint, which
re-extracts skills from resume_text server-side and returns a complete
gap analysis in one stateless call. The endpoint already logs the
xAPI "assessed" event, so this page does not call log_gap_analysis_event
itself.

Behavior note: the readiness check now gates on resume_text being
present (the API's actual required input), not on user_skills, since
user_skills was only ever a client-side artifact of the old in-process
call and is no longer what the API consumes.
"""

from __future__ import annotations

from collections import defaultdict

import streamlit as st

from api_client import analyze_gap, get_skills_resources, list_occupations


def render() -> None:
    st.header("My reskilling pathway")

    if not st.session_state["resume_text"]:
        st.warning("Upload a resume first on the **Upload resume** page.")
        return

    occupations = list_occupations()

    target = st.selectbox(
        "Target occupation",
        occupations,
        index=occupations.index(st.session_state["target_occupation"])
        if st.session_state["target_occupation"] in occupations
        else 0,
    )

    if st.button("Analyze gap", type="primary"):
        try:
            with st.spinner("Calling the gap-analysis API..."):
                result = analyze_gap(
                    resume_text=st.session_state["resume_text"],
                    target_occupation=target,
                    actor_email=st.session_state["xapi_actor_email"],
                )
        except ValueError as exc:
            st.error(str(exc))
            return

        st.session_state["target_occupation"] = target
        st.session_state["gap_result"] = result

    result = st.session_state["gap_result"]
    if not result or result.occupation_title != target:
        st.caption("Click **Analyze gap** to compare your skills against this role.")
        return

    st.subheader(f"Readiness for {result.occupation_title}")
    st.progress(result.readiness_score / 100)
    st.metric("Readiness score", f"{result.readiness_score}%")

    col1, col2 = st.columns(2)
    with col1:
        st.write(f"**Skills you already have ({len(result.matched_skills)})**")
        for s in result.matched_skills:
            st.write(f"- {s.skill_name}")
        if not result.matched_skills:
            st.caption("No overlapping skills found yet.")

    with col2:
        st.write(f"**Priority gaps ({len(result.missing_skills)})**")
        for g in result.missing_skills:
            st.write(f"- {g.skill_name} _(importance {g.importance})_")
        if not result.missing_skills:
            st.caption("No gaps \u2014 you meet the core requirements for this role.")

    if result.missing_skills:
        st.subheader("Reskilling roadmap")
        st.caption(
            "Skills grouped by domain into tracks you can pursue in parallel, ordered by "
            "importance within each track. This reflects domain grouping, not a verified "
            "skill-prerequisite sequence \u2014 the underlying taxonomy does not model which "
            "skills must be learned before others. Each skill links to a curated course where "
            "one has been vetted, and to a search query on reputable platforms otherwise \u2014 "
            "never a specific course we can't verify exists."
        )
        tracks: dict[str, list] = defaultdict(list)
        for g in result.missing_skills:
            tracks[g.domain].append(g)
        for domain in tracks:
            tracks[domain].sort(key=lambda g: g.importance, reverse=True)

        try:
            resources_by_skill = get_skills_resources(
                [{"skill_id": g.skill_id, "skill_name": g.skill_name} for g in result.missing_skills]
            )
        except Exception:
            # Resource suggestions are a nice-to-have enhancement on
            # top of the core gap analysis, not a dependency of it --
            # if the resources call fails for any reason, the roadmap
            # itself still renders, just without links.
            resources_by_skill = {}

        track_cols = st.columns(len(tracks))
        for col, (domain, skills) in zip(track_cols, tracks.items()):
            with col:
                st.markdown(f"**{domain}**")
                for g in skills:
                    st.write(f"{g.skill_name}")
                    st.caption(f"importance {g.importance}")
                    for link in resources_by_skill.get(g.skill_id, []):
                        label = (
                            f"\u2713 {link['title']}"
                            if link["tier"] == "curated"
                            else f"Search {link['provider']}"
                        )
                        st.markdown(f"[{label}]({link['url']})")
