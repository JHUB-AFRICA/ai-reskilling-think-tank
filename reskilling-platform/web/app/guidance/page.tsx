"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppState } from "@/lib/state";
import { authedApi, ApiError, type SkillSuggestion } from "@/lib/api";
import styles from "./page.module.css";

export default function GuidancePage() {
  const { session, sessionLoading, resumeText } = useAppState();
  const [careerGoal, setCareerGoal] = useState("");
  const [suggestions, setSuggestions] = useState<SkillSuggestion[] | null>(null);
  const [cached, setCached] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (sessionLoading) {
    return <p>Checking session...</p>;
  }

  if (!session) {
    return (
      <div>
        <h1>AI career guidance</h1>
        <p className={styles.lead}>
          This feature requires an account. <Link href="/login">Sign in</Link> to continue.
        </p>
      </div>
    );
  }

  async function handleSubmit() {
    if (!careerGoal.trim()) {
      setError("Describe a career goal first.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await authedApi.careerGuidance(
        resumeText,
        careerGoal,
        session!.access_token,
      );
      setSuggestions(result.suggestions);
      setCached(result.cached);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Career guidance request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>AI career guidance</h1>
      <p className={styles.lead}>
        Describe a career goal in your own words — including ones outside the platform&apos;s
        fixed taxonomy of about 1,000 occupations. Every suggested skill is checked against the
        taxonomy before being shown to you: a <strong>taxonomy match</strong> is a skill the
        platform already tracks with real labour-market data behind it. An{" "}
        <strong>emerging</strong> tag means the suggestion isn&apos;t in the taxonomy — it may
        still be a genuinely good idea, but it hasn&apos;t been independently verified against
        labour-market data the way the rest of this platform is. Treat that distinction as the
        actual signal here, not a footnote.
      </p>

      {!resumeText && (
        <p className={styles.warning}>
          You haven&apos;t extracted any skills yet on the Upload resume page — guidance will
          still work, but won&apos;t account for what you already know.
        </p>
      )}

      <textarea
        className={styles.textarea}
        value={careerGoal}
        onChange={(e) => setCareerGoal(e.target.value)}
        placeholder="e.g. I want to move into MLOps within the next year"
        rows={3}
      />

      {error && <p className={styles.error}>{error}</p>}

      <button className={styles.primaryButton} onClick={handleSubmit} disabled={loading}>
        {loading ? "Asking Gemini..." : "Get suggestions"}
      </button>

      <p className={styles.rateLimit}>Limited to 5 requests per day; identical requests are cached for 1 hour.</p>

      {suggestions && (
        <div className={styles.results}>
          {cached && <p className={styles.cachedNote}>Showing a cached result from earlier today.</p>}
          <ul className={styles.suggestionList}>
            {suggestions.map((s) => (
              <li key={s.skill_name} className={styles.suggestionItem}>
                <span className={styles.suggestionName}>{s.skill_name}</span>
                <span
                  className={
                    s.status === "taxonomy_match" ? styles.badgeMatch : styles.badgeEmerging
                  }
                >
                  {s.status === "taxonomy_match" ? "taxonomy match" : "emerging"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
