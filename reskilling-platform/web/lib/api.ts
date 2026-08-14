// lib/api.ts
//
// TypeScript counterpart to app/api_client.py. Both frontends
// (Streamlit and this Next.js app) speak the exact same contract to
// the FastAPI service in app_api/main.py -- neither one has its own
// notion of the platform's business logic.

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface SkillMatch {
  skill_id: string;
  skill_name: string;
  domain: string;
  matched_text: string;
  method: "exact" | "embedding";
  confidence: number;
}

export interface SkillGap {
  skill_id: string;
  skill_name: string;
  domain: string;
  importance: number;
}

export interface GapAnalysisResult {
  occupation_title: string;
  readiness_score: number;
  matched_skills: SkillMatch[];
  missing_skills: SkillGap[];
}

export interface TaxonomyStats {
  occupation_count: number;
  skill_count: number;
  domain_count: number;
  technology_skill_count: number;
  domain_distribution: Record<string, number>;
}

export interface RequirementRow {
  skill_name: string;
  domain: string;
  source: "general" | "technology";
  importance: number;
}

export interface XapiStatement {
  actor: { mbox: string; name?: string };
  verb: { id: string; display: { "en-US": string } };
  object: { id: string; definition: { name: { "en-US": string } } };
  timestamp: string;
  result?: { extensions: Record<string, unknown> };
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.detail ?? res.statusText, res.status);
  }
  return res.json();
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new ApiError(errBody.detail ?? res.statusText, res.status);
  }
  return res.json();
}

export const api = {
  health: () => apiGet<{ status: string }>("/health"),

  occupations: () => apiGet<{ occupations: string[] }>("/occupations").then((r) => r.occupations),

  taxonomyStats: () => apiGet<TaxonomyStats>("/taxonomy/stats"),

  requirementsFor: (occupation: string) =>
    apiGet<{ requirements: RequirementRow[] }>(
      `/taxonomy/requirements?occupation=${encodeURIComponent(occupation)}`,
    ).then((r) => r.requirements),

  extractSkills: (resumeText: string) =>
    apiPost<{ skills: SkillMatch[] }>("/extract-skills", { resume_text: resumeText }).then(
      (r) => r.skills,
    ),

  analyzeGap: (resumeText: string, targetOccupation: string, actorEmail: string) =>
    apiPost<GapAnalysisResult>("/analyze-gap", {
      resume_text: resumeText,
      target_occupation: targetOccupation,
      actor_email: actorEmail,
    }),

  lrsStatements: (limit = 50) =>
    apiGet<{ statements: XapiStatement[] }>(`/lrs/statements?limit=${limit}`).then(
      (r) => r.statements,
    ),
};

export interface SkillSuggestion {
  skill_name: string;
  status: "taxonomy_match" | "emerging";
  matched_skill_id: string | null;
}

export interface SavedGapAnalysis {
  id: number;
  occupation_title: string;
  readiness_score: number;
  matched_skill_ids: string[];
  missing_skill_ids: string[];
  created_at: string;
}

async function apiPostAuthed<T>(path: string, body: unknown, accessToken: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new ApiError(errBody.detail ?? res.statusText, res.status);
  }
  return res.json();
}

async function apiGetAuthed<T>(path: string, accessToken: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new ApiError(errBody.detail ?? res.statusText, res.status);
  }
  return res.json();
}

export interface UserProfile {
  id: string;
  email: string;
  role: "job_seeker" | "workforce_analyst" | "administrator";
}

export interface ResourceLink {
  title: string;
  url: string;
  provider: string;
  tier: "curated" | "search";
  is_free: boolean | null;
}

export const authedApi = {
  careerGuidance: (resumeText: string, careerGoal: string, accessToken: string) =>
    apiPostAuthed<{ suggestions: SkillSuggestion[]; cached: boolean }>(
      "/me/career-guidance",
      { resume_text: resumeText, career_goal: careerGoal },
      accessToken,
    ),

  saveGapAnalysis: (resumeText: string, targetOccupation: string, accessToken: string) =>
    apiPostAuthed<GapAnalysisResult>(
      "/me/gap-analyses",
      { resume_text: resumeText, target_occupation: targetOccupation },
      accessToken,
    ),

  myGapAnalyses: (accessToken: string) =>
    apiGetAuthed<{ analyses: SavedGapAnalysis[] }>("/me/gap-analyses", accessToken).then(
      (r) => r.analyses,
    ),

  myProfile: (accessToken: string) => apiGetAuthed<UserProfile>("/me/profile", accessToken),

  adminListUsers: (accessToken: string) =>
    apiGetAuthed<{ users: UserProfile[] }>("/admin/users", accessToken).then((r) => r.users),

  adminUpdateRole: (userId: string, role: string, accessToken: string) => {
    return fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ role }),
    }).then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new ApiError(body.detail ?? res.statusText, res.status);
      }
      return res.json();
    });
  },
};

// Public -- no auth required, matches the backend's design (resource
// suggestions belong on the anonymous roadmap too).
export function getSkillsResources(
  skills: { skill_id: string; skill_name: string }[],
): Promise<Record<string, ResourceLink[]>> {
  return fetch(`${API_BASE_URL}/skills/resources`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ skills }),
    cache: "no-store",
  }).then(async (res) => {
    if (!res.ok) throw new ApiError(res.statusText, res.status);
    const data = await res.json();
    return data.resources as Record<string, ResourceLink[]>;
  });
}

export { ApiError };
