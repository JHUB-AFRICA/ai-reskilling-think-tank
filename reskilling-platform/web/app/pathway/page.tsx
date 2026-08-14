"use client";

import { useEffect, useState } from "react";
import { useAppState } from "@/lib/state";
import { api, ApiError } from "@/lib/api";
import { ReadinessGauge } from "@/components/ReadinessGauge";
import { RoadmapTracks } from "@/components/RoadmapTracks";
import styles from "./page.module.css";

export default function PathwayPage() {
  const { resumeText, targetOccupation, setTargetOccupation, gapResult, setGapResult, session } =
    useAppState();

  const [occupations, setOccupations] = useState<string[]>([]);
  const [selected, setSelected] = useState(targetOccupation ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.occupations().then((list) => {
      setOccupations(list);
      if (!selected && list.length > 0) setSelected(list[0]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAnalyze() {
    setError(null);
    setLoading(true);
    try {
      const actorEmail = session?.user.email ?? "anonymous@platform-demo";
      const result = await api.analyzeGap(resumeText, selected, actorEmail);
      setTargetOccupation(selected);
      setGapResult(result);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gap analysis failed. Is the API running?");
    } finally {
      setLoading(false);
    }
  }

  if (!resumeText) {
    return (
      <div>
        <h1>My reskilling pathway</h1>
        <p className={styles.warning}>Upload a resume first on the Upload resume page.</p>
      </div>
    );
  }

  const showResult = gapResult && gapResult.occupation_title === selected;

  return (
    <div>
      <h1>My reskilling pathway</h1>

      <select
        className={styles.select}
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
      >
        {occupations.map((occ) => (
          <option key={occ} value={occ}>
            {occ}
          </option>
        ))}
      </select>

      {error && <p className={styles.error}>{error}</p>}

      <div>
        <button className={styles.primaryButton} onClick={handleAnalyze} disabled={loading}>
          {loading ? "Calling the gap-analysis API..." : "Analyze gap"}
        </button>
      </div>

      {!showResult && (
        <p className={styles.hint}>Click Analyze gap to compare your skills against this role.</p>
      )}

      {showResult && gapResult && (
        <div className={styles.results}>
          <div className="panel">
            <ReadinessGauge score={gapResult.readiness_score} occupation={gapResult.occupation_title} />
          </div>

          <div className={styles.columns}>
            <div className="panel">
              <h3>Skills you already have ({gapResult.matched_skills.length})</h3>
              {gapResult.matched_skills.length === 0 && (
                <p className={styles.hint}>No overlapping skills found yet.</p>
              )}
              <ul className={styles.list}>
                {gapResult.matched_skills.map((s) => (
                  <li key={s.skill_id}>{s.skill_name}</li>
                ))}
              </ul>
            </div>

            <div className="panel">
              <h3>Priority gaps ({gapResult.missing_skills.length})</h3>
              {gapResult.missing_skills.length === 0 && (
                <p className={styles.hint}>No gaps — you meet the core requirements for this role.</p>
              )}
              <ul className={styles.list}>
                {gapResult.missing_skills.map((g) => (
                  <li key={g.skill_id}>
                    {g.skill_name} <span className={styles.importance}>(importance {g.importance})</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="panel" style={{ marginTop: 16 }}>
            <h2>Reskilling roadmap</h2>
            <RoadmapTracks missingSkills={gapResult.missing_skills} />
          </div>
        </div>
      )}
    </div>
  );
}
