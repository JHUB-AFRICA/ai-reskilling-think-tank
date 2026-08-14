// lib/state.tsx
//
// Next.js has no built-in equivalent to Streamlit's st.session_state --
// this Context plays the identical role: client-side state that
// persists across page navigation within a browser session, holding
// exactly the same fields documented in app/SESSION_STATE.md, plus
// (added alongside real Supabase Auth wiring) the authenticated
// session itself.
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { authedApi, type SkillMatch, type GapAnalysisResult, type UserProfile } from "./api";

interface AppState {
  resumeText: string;
  setResumeText: (v: string) => void;
  userSkills: SkillMatch[];
  setUserSkills: (v: SkillMatch[]) => void;
  targetOccupation: string | null;
  setTargetOccupation: (v: string | null) => void;
  gapResult: GapAnalysisResult | null;
  setGapResult: (v: GapAnalysisResult | null) => void;
  session: Session | null;
  sessionLoading: boolean;
  profile: UserProfile | null;
  profileLoading: boolean;
}

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [resumeText, setResumeText] = useState("");
  const [userSkills, setUserSkills] = useState<SkillMatch[]>([]);
  const [targetOccupation, setTargetOccupation] = useState<string | null>(null);
  const [gapResult, setGapResult] = useState<GapAnalysisResult | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      return;
    }
    setProfileLoading(true);
    authedApi
      .myProfile(session.access_token)
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setProfileLoading(false));
  }, [session]);

  const value: AppState = {
    resumeText,
    setResumeText,
    userSkills,
    setUserSkills,
    targetOccupation,
    setTargetOccupation,
    gapResult,
    setGapResult,
    session,
    sessionLoading,
    profile,
    profileLoading,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return ctx;
}

