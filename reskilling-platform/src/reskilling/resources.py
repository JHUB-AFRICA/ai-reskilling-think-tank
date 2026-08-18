"""
resources.py

Learning resource suggestions for skills on a generated roadmap.
Implements the JKUAT proposal's "Zero Hallucination Guardrails"
requirement (FR-03) the same way the rest of this platform handles
anti-hallucination: never presenting unverified content as verified.

Two tiers, always labeled distinctly:

    "curated" -- a real, admin-vetted course from the learning_resources
                 table (see db/migrations/005). Trustworthy because a
                 human checked it, not because a model generated it.

    "search"  -- a deterministic search-query URL on a reputable
                 platform (Coursera, edX, YouTube, freeCodeCamp),
                 built from the skill name itself. This is NOT a
                 specific course recommendation -- no course title,
                 provider claim, or URL is invented. It is guaranteed
                 to resolve to real, current results because it is
                 just a search query, the same reason web_search
                 results are trustworthy where a fabricated citation
                 would not be.

A skill with no curated entry still gets search-tier suggestions --
never zero results -- but the two tiers are never merged into a single
undifferentiated list; the frontend is expected to show the trust
distinction, not hide it.
"""

from __future__ import annotations

import urllib.parse
from dataclasses import dataclass


@dataclass(frozen=True)
class ResourceLink:
    title: str
    url: str
    provider: str
    tier: str  # "curated" or "search"
    is_free: bool | None = None

    def to_dict(self) -> dict:
        return {
            "title": self.title,
            "url": self.url,
            "provider": self.provider,
            "tier": self.tier,
            "is_free": self.is_free,
        }


# Each entry: (provider name, url template, is_free). The query is
# URL-encoded at call time, never string-formatted directly into the
# template, to avoid malformed URLs on skill names containing special
# characters (e.g. "C++", "Node.js").
_SEARCH_PROVIDERS: list[tuple[str, str, bool]] = [
    ("Coursera", "https://www.coursera.org/search?query={q}", False),
    ("edX", "https://www.edx.org/search?q={q}", False),
    ("freeCodeCamp", "https://www.freecodecamp.org/news/search/?query={q}", True),
    ("YouTube", "https://www.youtube.com/results?search_query={q}+tutorial", True),
]


def get_search_fallback_resources(skill_name: str, limit: int = 2) -> list[ResourceLink]:
    """
    Deterministic, guaranteed-valid search links. `limit` caps how
    many providers are surfaced per skill, to avoid overwhelming the
    roadmap UI with four links per node -- default 2 (one paid-leaning,
    one free-leaning) is a reasonable balance, not an arbitrary cut.
    """
    query = urllib.parse.quote_plus(skill_name)
    links = [
        ResourceLink(
            title=f"Search {provider} for \"{skill_name}\"",
            url=template.format(q=query),
            provider=provider,
            tier="search",
            is_free=is_free,
        )
        for provider, template, is_free in _SEARCH_PROVIDERS
    ]
    return links[:limit]


def merge_resources(
    curated_rows: list[dict], skill_name: str, search_limit: int = 2
) -> list[ResourceLink]:
    """
    curated_rows is expected in the shape returned by
    db.fetch_learning_resources(skill_id) -- dicts with title/url/
    provider/is_free keys. Curated entries always come first; search
    fallback is always appended, never omitted, even when curated
    entries exist -- a roadmap skill can always use more than one
    suggested starting point, and the two tiers are distinguishable by
    the caller regardless of ordering.
    """
    curated = [
        ResourceLink(
            title=row["title"],
            url=row["url"],
            provider=row["provider"],
            tier="curated",
            is_free=row.get("is_free"),
        )
        for row in curated_rows
    ]
    return curated + get_search_fallback_resources(skill_name, limit=search_limit)
