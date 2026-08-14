// components/RoadmapTracks.tsx
//
// Groups gap-analysis missing_skills into parallel tracks by domain
// (Technology, Communication, Data & Analytics, etc.), ordered by
// importance within each track. This is deliberately NOT a true
// prerequisite-dependency DAG: O*NET provides no "skill X must be
// learned before skill Y" data, and fabricating fake prerequisite
// edges to look more sophisticated would misrepresent the underlying
// data. Grouping by domain is an honest, defensible reading of the
// same "parallel tracks, not one linear list" idea the original
// architecture proposal called for.
//
// Each skill node also fetches learning-resource links (a single
// batched call, not one request per skill) via /skills/resources --
// see src/reskilling/resources.py for the curated-vs-search trust
// distinction rendered here.
"use client";

import { useEffect, useState } from "react";
import type { SkillGap } from "@/lib/api";
import { getSkillsResources, type ResourceLink } from "@/lib/api";
import styles from "./RoadmapTracks.module.css";

export function RoadmapTracks({ missingSkills }: { missingSkills: SkillGap[] }) {
  const [resourcesBySkill, setResourcesBySkill] = useState<Record<string, ResourceLink[]>>({});

  useEffect(() => {
    if (missingSkills.length === 0) return;
    const skills = missingSkills.map((s) => ({ skill_id: s.skill_id, skill_name: s.skill_name }));
    getSkillsResources(skills)
      .then(setResourcesBySkill)
      .catch(() => setResourcesBySkill({}));
  }, [missingSkills]);

  const tracks = new Map<string, SkillGap[]>();
  for (const skill of missingSkills) {
    const list = tracks.get(skill.domain) ?? [];
    list.push(skill);
    tracks.set(skill.domain, list);
  }
  for (const list of tracks.values()) {
    list.sort((a, b) => b.importance - a.importance);
  }

  if (tracks.size === 0) {
    return <p className={styles.empty}>No gaps to build a roadmap from.</p>;
  }

  return (
    <div>
      <p className={styles.caption}>
        Skills grouped by domain into tracks you can pursue in parallel, ordered by importance
        within each track. This reflects domain grouping, not a verified skill-prerequisite
        sequence — the underlying taxonomy does not model which skills must be learned before
        others. Each skill links to a curated course where one has been vetted, and to a search
        query on reputable platforms otherwise — never a specific course we can't verify exists.
      </p>
      <div className={styles.trackRow}>
        {Array.from(tracks.entries()).map(([domain, skills]) => (
          <div key={domain} className={styles.track}>
            <div className={styles.trackHeader}>{domain}</div>
            <div className={styles.nodeColumn}>
              {skills.map((skill, i) => (
                <div key={skill.skill_id} className={styles.nodeWrap}>
                  {i > 0 && <div className={styles.connector} />}
                  <div className="panel" style={{ padding: "10px 14px" }}>
                    <div className={styles.nodeName}>{skill.skill_name}</div>
                    <div className={`${styles.nodeImportance} mono`}>
                      importance {skill.importance.toFixed(1)}
                    </div>
                    <ResourceLinks links={resourcesBySkill[skill.skill_id]} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResourceLinks({ links }: { links?: ResourceLink[] }) {
  if (!links || links.length === 0) {
    return null;
  }
  return (
    <div className={styles.resourceList}>
      {links.map((link) => (
        <a
          key={link.url}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className={link.tier === "curated" ? styles.resourceCurated : styles.resourceSearch}
        >
          {link.tier === "curated" ? link.title : `Search ${link.provider}`}
        </a>
      ))}
    </div>
  );
}
