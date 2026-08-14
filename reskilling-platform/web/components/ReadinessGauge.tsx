import styles from "./ReadinessGauge.module.css";

const SEGMENTS = 20;

export function ReadinessGauge({
  score,
  occupation,
}: {
  score: number;
  occupation: string;
}) {
  const filledSegments = Math.round((score / 100) * SEGMENTS);

  return (
    <div className={styles.gauge}>
      <div className={styles.segments} role="img" aria-label={`Readiness ${score}% for ${occupation}`}>
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <span
            key={i}
            className={i < filledSegments ? styles.segmentFilled : styles.segmentEmpty}
          />
        ))}
      </div>
      <div className={styles.readout}>
        <span className={`${styles.score} mono`}>{score.toFixed(1)}%</span>
        <span className={styles.label}>ready for {occupation}</span>
      </div>
    </div>
  );
}
