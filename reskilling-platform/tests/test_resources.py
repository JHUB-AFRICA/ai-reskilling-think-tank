"""
test_resources.py

Tests the learning-resource link generation -- pure logic, no network
or database required, since the whole design point is that the
"search" tier is deterministic and the "curated" tier is just data
passed in.

Run with: pytest tests/test_resources.py -v
"""

from __future__ import annotations

from reskilling.resources import get_search_fallback_resources, merge_resources


class TestSearchFallbackResources:
    def test_returns_requested_number_of_links(self):
        links = get_search_fallback_resources("Python", limit=2)
        assert len(links) == 2

    def test_all_links_tagged_search_tier(self):
        links = get_search_fallback_resources("Python")
        assert all(link.tier == "search" for link in links)

    def test_skill_name_is_url_encoded(self):
        links = get_search_fallback_resources("C++", limit=1)
        assert "C%2B%2B" in links[0].url

    def test_skill_name_with_spaces_is_encoded(self):
        links = get_search_fallback_resources("Machine Learning", limit=1)
        assert " " not in links[0].url

    def test_limit_zero_returns_empty(self):
        assert get_search_fallback_resources("Python", limit=0) == []

    def test_limit_beyond_available_providers_caps_at_max(self):
        links = get_search_fallback_resources("Python", limit=99)
        assert len(links) <= 4  # never more than the defined provider count


class TestMergeResources:
    def test_no_curated_rows_returns_only_search_tier(self):
        result = merge_resources([], "Python", search_limit=2)
        assert len(result) == 2
        assert all(r.tier == "search" for r in result)

    def test_curated_rows_come_first(self):
        curated = [
            {
                "title": "Real Python Course",
                "url": "https://example.com/py",
                "provider": "Example Academy",
                "is_free": False,
            }
        ]
        result = merge_resources(curated, "Python", search_limit=1)
        assert result[0].tier == "curated"
        assert result[0].title == "Real Python Course"
        assert result[1].tier == "search"

    def test_curated_and_search_both_present(self):
        curated = [
            {
                "title": "X",
                "url": "https://x.com",
                "provider": "X Academy",
                "is_free": True,
            }
        ]
        result = merge_resources(curated, "SQL", search_limit=2)
        tiers = [r.tier for r in result]
        assert tiers == ["curated", "search", "search"]

    def test_curated_row_fields_preserved(self):
        curated = [
            {
                "title": "X",
                "url": "https://x.com",
                "provider": "X Academy",
                "is_free": True,
            }
        ]
        result = merge_resources(curated, "SQL", search_limit=0)
        assert result[0].to_dict() == {
            "title": "X",
            "url": "https://x.com",
            "provider": "X Academy",
            "tier": "curated",
            "is_free": True,
        }
