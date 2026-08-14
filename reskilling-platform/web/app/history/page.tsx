"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppState } from "@/lib/state";
import { authedApi, ApiError, type SavedGapAnalysis } from "@/lib/api";
import styles from "./page.module.css";

export default function HistoryPage() {
  const { session, sessionLoading } = useAppState();
  const [analyses, setAnalyses] = useState<SavedGapAnalysis[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    authedApi
      .myGapAnalyses(session.access_token)
      .then(setAnalyses)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load history."))
      .finally(() => setLoading(false));
  }, [session]);

  if (sessionLoading) {
    return <p>Checking session...</p>;
  }

  if (!session) {
    return (
      <div>
        <h1>My analysis history</h1>
        <p className={styles.lead}>
          This feature requires an account. <Link href="/login">Sign in</Link> to continue.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1>My analysis history</h1>
      <p className={styles.lead}>
        Every gap analysis you&apos;ve saved to your account, most recent first. This is separate
        from the anonymous readiness checks on the My reskilling pathway page — those are
        session-only and never persisted.
      </p>

      {loading && <p>Loading...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {analyses && analyses.length === 0 && (
        <p className={styles.empty}>No saved analyses yet.</p>
      )}

      {analyses && analyses.length > 0 && (
        <div className={styles.list}>
          {analyses.map((a) => (
            <div key={a.id} className="panel">
              <div className={styles.rowTop}>
                <h3>{a.occupation_title}</h3>
                <span className={`${styles.score} mono`}>{a.readiness_score.toFixed(1)}%</span>
              </div>
              <div className={styles.rowMeta}>
                {new Date(a.created_at).toLocaleString()} · {a.matched_skill_ids.length}{" "}
                matched · {a.missing_skill_ids.length} gaps
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
