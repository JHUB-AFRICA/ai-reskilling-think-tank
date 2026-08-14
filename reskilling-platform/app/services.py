"""
services.py

Cached construction of expensive objects (spaCy-backed SkillExtractor,
taxonomy-backed ReskillingRecommender) for use across the Streamlit app.

Why this file exists as a separate layer: Streamlit reruns the entire
script top-to-bottom on every user interaction. If a page module called
`SkillExtractor()` directly in its body, the spaCy model would reload
from disk on every button click -- the single most common cause of a
"slow" Streamlit app. `@st.cache_resource` makes Streamlit construct the
object once per server process and hand back the same instance on every
subsequent call, across all users' sessions (this is *resource* caching,
not per-user *data* caching -- the model itself is stateless and safe
to share).

Page modules should import get_extractor() / get_recommender() from
here and never import SkillExtractor / ReskillingRecommender directly.
"""

from __future__ import annotations

import streamlit as st

from reskilling.nlp import SkillExtractor
from reskilling.recommender import ReskillingRecommender


@st.cache_resource(show_spinner="Loading NLP model...")
def get_extractor() -> SkillExtractor:
    return SkillExtractor()


@st.cache_resource(show_spinner="Loading taxonomy...")
def get_recommender() -> ReskillingRecommender:
    return ReskillingRecommender()
