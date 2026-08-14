// app/page.tsx
//
// Deliberately a Server Component (no "use client") -- this fetches
// taxonomy stats at request time on the server, which is the concrete
// SSR benefit the original architecture proposal called for: the
// dashboard's data is present in the initial HTML, not fetched after
// a client-side loading spinner.
import { api } from "@/lib/api";
import { LatestReadiness } from "@/components/LatestReadiness";
import styles from "./page.module.css";

export default async function DashboardPage() {
  const stats = await api.taxonomyStats();
  const maxCount = Math.max(...Object.values(stats.domain_distribution));

  return (
    <div>
      <h1>Workforce readiness dashboard</h1>
      <p className={styles.lead}>
        An overview of the platform&apos;s skills taxonomy coverage. Upload your resume to get a
        personalized readiness score.
      </p>

      <div className={styles.statGrid}>
        <div className={`panel ${styles.statCard}`}>
          <div className={styles.statValue}>{stats.occupation_count}</div>
          <div className={styles.statLabel}>Occupations covered</div>
        </div>
        <div className={`panel ${styles.statCard}`}>
          <div className={styles.statValue}>{stats.skill_count}</div>
          <div className={styles.statLabel}>Unique skills tracked</div>
        </div>
        <div className={`panel ${styles.statCard}`}>
          <div className={styles.statValue}>{stats.domain_count}</div>
          <div className={styles.statLabel}>Domains</div>
        </div>
        <div className={`panel ${styles.statCard}`}>
          <div className={styles.statValue}>{stats.technology_skill_count}</div>
          <div className={styles.statLabel}>Technology-specific skills</div>
        </div>
      </div>

      <h2 className={styles.sectionHeading}>Skills by domain</h2>
      <div className="panel">
        {Object.entries(stats.domain_distribution).map(([domain, count]) => (
          <div key={domain} className={styles.barRow}>
            <span className={styles.barLabel}>{domain}</span>
            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{ width: `${(count / maxCount) * 100}%` }}
              />
            </div>
            <span className={`${styles.barCount} mono`}>{count}</span>
          </div>
        ))}
      </div>

      <h2 className={styles.sectionHeading}>Your latest readiness check</h2>
      <div className="panel">
        <LatestReadiness />
      </div>
    </div>
  );
}
