"use client";

import { useEffect, useState } from "react";
import { api, RequirementRow } from "@/lib/api";
import styles from "./page.module.css";

export default function TrendsPage() {
  const [occupations, setOccupations] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [requirements, setRequirements] = useState<RequirementRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.occupations().then((list) => {
      setOccupations(list);
      if (list.length > 0) setSelected(list[0]);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    api.requirementsFor(selected).then(setRequirements);
  }, [selected]);

  return (
    <div>
      <h1>Labour market trends</h1>
      <p className={styles.lead}>
        Live wage and employment-trend enrichment (BLS OEWS, ILOSTAT) is scoped for v1.1 — see
        the Labour Market Data Sources Catalogue. This view currently reflects O*NET-derived
        skill importance data.
      </p>

      {loading ? (
        <p>Loading occupations...</p>
      ) : (
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
      )}

      {selected && (
        <>
          <h2 className={styles.sectionHeading}>Top skills for {selected}</h2>
          <div className="panel">
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Skill</th>
                  <th>Domain</th>
                  <th>Source</th>
                  <th>Importance</th>
                </tr>
              </thead>
              <tbody>
                {requirements.map((r) => (
                  <tr key={r.skill_name}>
                    <td>{r.skill_name}</td>
                    <td>{r.domain}</td>
                    <td>{r.source}</td>
                    <td className="mono">{r.importance.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
