"use client";

import { useState } from "react";
import { useAppState } from "@/lib/state";
import { api, ApiError } from "@/lib/api";
import styles from "./page.module.css";

const SAMPLE_RESUME =
  "Experienced analyst with a background in data analysis and Python. " +
  "Built ML pipelines using PyTorch and deployed models on AWS. " +
  "Comfortable with SQL for querying production databases. " +
  "Strong active listening and critical thinking skills developed " +
  "through years of client-facing consulting work.";

export default function UploadResumePage() {
  const { resumeText, setResumeText, userSkills, setUserSkills } = useAppState();
  const [draft, setDraft] = useState(resumeText);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExtract() {
    if (!draft.trim()) {
      setError("Paste resume text first, or use the sample resume.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const skills = await api.extractSkills(draft);
      setResumeText(draft);
      setUserSkills(skills);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Extraction failed. Is the API running?");
    } finally {
      setLoading(false);
    }
  }

  const exactCount = userSkills.filter((s) => s.method === "exact").length;
  const inferredCount = userSkills.filter((s) => s.method === "embedding").length;

  return (
    <div>
      <h1>Upload your resume</h1>
      <p className={styles.lead}>
        Paste your resume text below. We&apos;ll extract the skills our system recognizes against
        the platform&apos;s skills taxonomy.
      </p>

      <div className={styles.toolbar}>
        <button className={styles.secondaryButton} onClick={() => setDraft(SAMPLE_RESUME)}>
          Use sample resume
        </button>
      </div>

      <textarea
        className={styles.textarea}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Paste your resume content here..."
        rows={9}
      />

      {error && <p className={styles.error}>{error}</p>}

      <button className={styles.primaryButton} onClick={handleExtract} disabled={loading}>
        {loading ? "Calling the extraction API..." : "Extract skills"}
      </button>

      {userSkills.length > 0 && (
        <div className={styles.results}>
          <h2>Extracted skills</h2>
          <div className={styles.statRow}>
            <div className={`panel ${styles.statCard}`}>
              <div className={styles.statValue}>{exactCount}</div>
              <div className={styles.statLabel}>Exact matches</div>
            </div>
            <div className={`panel ${styles.statCard}`}>
              <div className={styles.statValue}>{inferredCount}</div>
              <div className={styles.statLabel}>Inferred matches</div>
            </div>
          </div>

          <div className="panel">
            {userSkills.map((skill) => (
              <div key={skill.skill_id} className={styles.skillRow}>
                <span className={styles.skillName}>{skill.skill_name}</span>
                <span className={styles.skillDomain}>{skill.domain}</span>
                <span className={styles.skillBadge}>
                  {skill.method === "exact" ? "exact" : `inferred (${Math.round(skill.confidence * 100)}%)`}
                </span>
              </div>
            ))}
          </div>

          <p className={styles.hint}>
            Go to <strong>My reskilling pathway</strong> to compare these skills against a target
            role.
          </p>
        </div>
      )}
    </div>
  );
}
