"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppState } from "@/lib/state";
import { authedApi, type SavedGapAnalysis } from "@/lib/api";
import styles from "./page.module.css";

export default function DashboardPage() {
  const { session, sessionLoading, profile, profileLoading } = useAppState();
  const [analyses, setAnalyses] = useState<SavedGapAnalysis[] | null>(null);

  useEffect(() => {
    if (!session) return;
    authedApi.myGapAnalyses(session.access_token).then(setAnalyses).catch(() => setAnalyses([]));
  }, [session]);

  if (sessionLoading || profileLoading) {
    return <p>Loading...</p>;
  }

  if (!session) {
    return (
      <div>
        <h1>My dashboard</h1>
        <p className={styles.lead}>
          This page requires an account. <Link href="/login">Sign in</Link> to continue.
        </p>
      </div>
    );
  }

  const latestScore = analyses && analyses.length > 0 ? analyses[0].readiness_score : null;
  const avgScore =
    analyses && analyses.length > 0
      ? analyses.reduce((sum, a) => sum + a.readiness_score, 0) / analyses.length
      : null;

  return (
    <div>
      <h1>My dashboard</h1>
      <p className={styles.lead}>
        Signed in as {profile?.email}
        {profile && <span className={styles.roleBadge}>{profile.role.replace("_", " ")}</span>}
      </p>

      {/* --- Job seeker: personal stats, always shown --- */}
      <div className={styles.statGrid}>
        <div className="panel">
          <div className={`${styles.statValue} mono`}>{analyses?.length ?? 0}</div>
          <div className={styles.statLabel}>Saved analyses</div>
        </div>
        <div className="panel">
          <div className={`${styles.statValue} mono`}>
            {latestScore !== null ? `${latestScore.toFixed(1)}%` : "\u2014"}
          </div>
          <div className={styles.statLabel}>Latest readiness</div>
        </div>
        <div className="panel">
          <div className={`${styles.statValue} mono`}>
            {avgScore !== null ? `${avgScore.toFixed(1)}%` : "\u2014"}
          </div>
          <div className={styles.statLabel}>Average readiness</div>
        </div>
      </div>

      <div className={styles.quickLinks}>
        <Link href="/pathway" className={styles.quickLink}>
          Run a new gap analysis →
        </Link>
        <Link href="/guidance" className={styles.quickLink}>
          Get AI career guidance →
        </Link>
        <Link href="/history" className={styles.quickLink}>
          View full history →
        </Link>
      </div>

      {/* --- Workforce analyst and administrator: aggregate context --- */}
      {(profile?.role === "workforce_analyst" || profile?.role === "administrator") && (
        <div className={styles.roleSection}>
          <h2>Workforce analyst tools</h2>
          <p className={styles.lead}>
            Aggregate cross-user trend views are not yet implemented — this section is scoped
            for a future release once there is enough real usage data to aggregate meaningfully.
            For now, the Labour market trends page and the Policy Brief Template
            (Policy_Brief_Template.docx) are the available tools for sector-level analysis.
          </p>
        </div>
      )}

      {/* --- Administrator only --- */}
      {profile?.role === "administrator" && (
        <div className={styles.roleSection}>
          <h2>Administrator tools</h2>
          <Link href="/admin" className={styles.quickLink}>
            Manage users and roles →
          </Link>
        </div>
      )}
    </div>
  );
}
