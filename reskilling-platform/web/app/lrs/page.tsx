"use client";

import { useEffect, useState } from "react";
import { api, XapiStatement } from "@/lib/api";
import styles from "./page.module.css";

export default function LrsViewerPage() {
  const [statements, setStatements] = useState<XapiStatement[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.lrsStatements().then((list) => {
      setStatements(list);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <h1>Learning Record Store</h1>
      <p className={styles.lead}>
        Raw xAPI statements recorded by this session, retrieved via the platform API. In a
        production deployment with a hosted LRS, this page would query the LRS&apos;s Statements
        API directly.
      </p>

      {loading && <p>Loading statements...</p>}

      {!loading && statements.length === 0 && (
        <p className={styles.hint}>
          No xAPI statements recorded yet — use the Upload resume or My reskilling pathway
          pages to generate activity.
        </p>
      )}

      {statements.length > 0 && (
        <>
          <div className="panel">
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Verb</th>
                  <th>Activity</th>
                </tr>
              </thead>
              <tbody>
                {statements.map((s, i) => (
                  <tr
                    key={i}
                    className={i === selectedIdx ? styles.rowSelected : styles.row}
                    onClick={() => setSelectedIdx(i)}
                  >
                    <td className="mono">{s.timestamp}</td>
                    <td>{s.actor.mbox.replace("mailto:", "")}</td>
                    <td>{s.verb.display["en-US"]}</td>
                    <td>{s.object.definition.name["en-US"]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className={styles.sectionHeading}>Raw statement</h2>
          <pre className={styles.jsonBlock}>{JSON.stringify(statements[selectedIdx], null, 2)}</pre>
        </>
      )}
    </div>
  );
}
