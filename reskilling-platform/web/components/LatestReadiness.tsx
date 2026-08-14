"use client";

import { useAppState } from "@/lib/state";
import { ReadinessGauge } from "./ReadinessGauge";

export function LatestReadiness() {
  const { gapResult } = useAppState();

  if (!gapResult) {
    return (
      <p style={{ color: "var(--muted)", fontSize: 13 }}>
        No readiness check yet — visit Upload resume to get started.
      </p>
    );
  }

  return (
    <ReadinessGauge score={gapResult.readiness_score} occupation={gapResult.occupation_title} />
  );
}
