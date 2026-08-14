"""
nlp.py

Layered skill extraction pipeline.

Layer 1 (primary):  spaCy PhraseMatcher against taxonomy vocabulary.
                     Fast, deterministic, high-precision exact phrase matches.

Layer 2 (fallback):  Word-vector cosine similarity for n-grams that found
                     no exact match in Layer 1. Catches paraphrases and
                     abbreviations (e.g. "ML" -> "Machine Learning") that
                     exact matching structurally cannot.

This two-layer design mirrors standard practice in production entity-linking
systems: deterministic-first, probabilistic-fallback. Layer 1 alone is too
brittle to phrasing variance; Layer 2 alone is too prone to false positives
and is harder to debug/audit. Together, most terms resolve via the cheap,
explainable Layer 1 path, and only the genuinely ambiguous remainder pays
the cost of Layer 2.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path

import pandas as pd
import spacy
from spacy.matcher import PhraseMatcher
from spacy.tokens import Doc

from reskilling.schemas import SkillMatch

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

TAXONOMY_PATH = Path("data/processed/skills_taxonomy_v1.csv")
SPACY_MODEL = "en_core_web_md"  # ships with word vectors -- required for Layer 2

# Below this cosine similarity, a candidate n-gram is not considered a
# match. Chosen conservatively: word-vector similarity is noisy, and a
# false-positive skill match (telling someone they have a skill they
# don't) is worse for a reskilling tool than a false negative.
EMBEDDING_SIMILARITY_THRESHOLD = 0.80

# Candidate n-gram window sizes to test against the taxonomy in Layer 2.
# Most skill phrases are 1-3 tokens ("Python", "Machine Learning",
# "Natural Language Processing"); going wider adds cost without much
# additional recall.
NGRAM_SIZES = (1, 2, 3)


class SkillExtractor:
    """
    Wraps a spaCy pipeline plus the taxonomy vocabulary into a single
    callable extraction service. Instantiate once (model + matcher build
    is the expensive part) and reuse across many extract() calls --
    this is why it is a class, not a function: Streamlit will call
    extract() once per user interaction, and rebuilding the matcher
    every time would make the UI feel sluggish.
    """

    def __init__(self, taxonomy_path: Path = TAXONOMY_PATH) -> None:
        logger.info("Loading spaCy model: %s", SPACY_MODEL)
        self.nlp = spacy.load(SPACY_MODEL)

        if not self.nlp.vocab.vectors_length:
            raise RuntimeError(
                f"{SPACY_MODEL} has no word vectors loaded -- Layer 2 "
                "(embedding fallback) requires a model with vectors. "
                "Confirm you installed en_core_web_md, not en_core_web_sm."
            )

        logger.info("Loading taxonomy from %s", taxonomy_path)
        taxonomy = pd.read_csv(taxonomy_path)

        # Deduplicate to one row per unique skill_name for vocabulary
        # purposes -- the taxonomy is occupation x skill grain, but the
        # matcher only needs the distinct skill terms.
        self.skill_lookup: dict[str, dict] = (
            taxonomy.drop_duplicates(subset=["skill_name"])
            .set_index("skill_name")[["skill_id", "domain"]]
            .to_dict(orient="index")
        )
        skill_names = list(self.skill_lookup.keys())
        logger.info("Taxonomy vocabulary: %d unique skill terms", len(skill_names))

        self.matcher = PhraseMatcher(self.nlp.vocab, attr="LOWER")
        patterns = [self.nlp.make_doc(name) for name in skill_names]
        self.matcher.add("TAXONOMY_SKILL", patterns)

        # Pre-compute taxonomy term docs once for Layer 2 cosine
        # comparison, rather than re-vectorizing the whole vocabulary
        # on every extract() call.
        self._taxonomy_docs: dict[str, Doc] = {
            name: self.nlp.make_doc(name) for name in skill_names
        }

    # ------------------------------------------------------------------
    # Layer 1: exact phrase matching
    # ------------------------------------------------------------------

    def _extract_exact(self, doc: Doc) -> tuple[list[SkillMatch], set[int]]:
        matches = self.matcher(doc)
        results: list[SkillMatch] = []
        matched_token_idxs: set[int] = set()

        for match_id, start, end in matches:
            span = doc[start:end]
            skill_name = self._canonical_name(span.text)
            if skill_name is None:
                continue
            meta = self.skill_lookup[skill_name]
            results.append(
                SkillMatch(
                    skill_id=meta["skill_id"],
                    skill_name=skill_name,
                    domain=meta["domain"],
                    matched_text=span.text,
                    method="exact",
                    confidence=1.0,
                )
            )
            matched_token_idxs.update(range(start, end))

        return results, matched_token_idxs

    def _canonical_name(self, matched_text: str) -> str | None:
        """PhraseMatcher matches case-insensitively; resolve back to the
        taxonomy's canonical casing for lookup."""
        lower_map = {k.lower(): k for k in self.skill_lookup}
        return lower_map.get(matched_text.lower())

    # ------------------------------------------------------------------
    # Layer 2: embedding fallback for unmatched spans
    # ------------------------------------------------------------------

    def _extract_embedding_fallback(
        self, doc: Doc, matched_token_idxs: set[int]
    ) -> list[SkillMatch]:
        results: list[SkillMatch] = []
        seen_skill_ids: set[str] = {m.skill_id for m in []}  # populated by caller dedup

        for n in NGRAM_SIZES:
            for start in range(len(doc) - n + 1):
                end = start + n
                if any(i in matched_token_idxs for i in range(start, end)):
                    continue  # already resolved by Layer 1

                span = doc[start:end]
                if span.text.strip() == "" or not any(t.is_alpha for t in span):
                    continue
                if not span.has_vector or span.vector_norm == 0:
                    continue

                best_name, best_score = None, 0.0
                for name, term_doc in self._taxonomy_docs.items():
                    if not term_doc.has_vector or term_doc.vector_norm == 0:
                        continue
                    score = span.similarity(term_doc)
                    if score > best_score:
                        best_name, best_score = name, score

                if best_name and best_score >= EMBEDDING_SIMILARITY_THRESHOLD:
                    meta = self.skill_lookup[best_name]
                    if meta["skill_id"] in seen_skill_ids:
                        continue
                    results.append(
                        SkillMatch(
                            skill_id=meta["skill_id"],
                            skill_name=best_name,
                            domain=meta["domain"],
                            matched_text=span.text,
                            method="embedding",
                            confidence=round(float(best_score), 3),
                        )
                    )
                    seen_skill_ids.add(meta["skill_id"])

        return results

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def extract(self, text: str) -> list[SkillMatch]:
        """
        Extract taxonomy-anchored skills from free text (resume body or
        job description). Returns deduplicated matches, exact matches
        always preferred over embedding matches for the same skill_id.
        """
        if not text or not text.strip():
            return []

        doc = self.nlp(text)
        exact_matches, matched_token_idxs = self._extract_exact(doc)

        exact_ids = {m.skill_id for m in exact_matches}
        embedding_matches = self._extract_embedding_fallback(doc, matched_token_idxs)
        embedding_matches = [m for m in embedding_matches if m.skill_id not in exact_ids]

        all_matches = exact_matches + embedding_matches
        logger.info(
            "Extracted %d skills (%d exact, %d embedding-fallback) from %d-token input",
            len(all_matches),
            len(exact_matches),
            len(embedding_matches),
            len(doc),
        )
        return all_matches


if __name__ == "__main__":
    extractor = SkillExtractor()
    sample = (
        "Built ML pipelines using PyTorch and deployed them on AWS. "
        "Strong background in data analysis and active listening during "
        "client meetings. Proficient in Python and SQL."
    )
    for match in extractor.extract(sample):
        print(f"{match.skill_name:30s} [{match.domain:12s}] via {match.method:9s} ({match.confidence})")
