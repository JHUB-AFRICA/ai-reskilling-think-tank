# Streamlit session state contract

Decided up front, before any UI code, because Streamlit reruns the entire
script on every interaction. Anything expensive (model loading) or anything
that must survive a rerun (user's uploaded resume, computed gap analysis)
must live in `st.session_state` or be wrapped in `@st.cache_resource`.

## Cached resources (loaded once per server process, shared across all users' sessions)

| Key                  | Type                | Loaded via              |
|----------------------|---------------------|--------------------------|
| (cached function)    | `SkillExtractor`    | `@st.cache_resource` on `get_extractor()` |
| (cached function)    | `ReskillingRecommender` | `@st.cache_resource` on `get_recommender()` |

These use `@st.cache_resource`, NOT `@st.cache_data` -- cache_resource is for
objects that shouldn't be copied/serialized (model objects, DB connections).
cache_data is for serializable return values like DataFrames.

## Per-session state (unique to each user's browser session)

| Key                          | Type                  | Set by                  | Read by                    |
|-------------------------------|-----------------------|---------------------------|-------------------------------|
| `resume_text`                 | `str`                  | Upload Resume page        | Pathway page                  |
| `user_skills`                 | `list[SkillMatch]`     | Upload Resume page (after extraction) | Pathway page |
| `target_occupation`            | `str`                  | Pathway page (dropdown)   | Pathway page                  |
| `gap_result`                   | `GapAnalysisResult`    | Pathway page (after analysis) | Pathway page, LRS logging |
| `xapi_actor_email`             | `str`                  | Sidebar (session "login") | LRS module                    |

## Rule

Page modules NEVER call `SkillExtractor()` or `ReskillingRecommender()`
directly. They always call `get_extractor()` / `get_recommender()` from
`app/services.py`, which wraps construction in `@st.cache_resource`. This
is the single most common Streamlit performance bug -- instantiating a
spaCy-backed class inside a page body means it reloads on every rerun.
