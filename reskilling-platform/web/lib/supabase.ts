// lib/supabase.ts
//
// Client-side Supabase client for authentication only -- this project
// deliberately does NOT use the Supabase JS client to query the
// database directly from the browser. All data access goes through
// the FastAPI service (app_api/main.py), which verifies the Supabase
// JWT itself (app_api/auth.py) and talks to Postgres server-side via
// SQLAlchemy. This keeps exactly one code path responsible for
// business logic and database access, rather than splitting it
// between a browser-side Supabase client and the FastAPI service.
"use client";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  // Deliberately does not throw at import time -- a missing config
  // here should surface as a clear login-page error when auth is
  // actually attempted, not crash every page (including anonymous
  // ones) or fail the production build. createClient() itself throws
  // immediately on an empty URL string, so a syntactically valid
  // placeholder is used here specifically to avoid that -- any actual
  // auth call against it will fail with a clear network/DNS error,
  // which is the correct failure mode until .env.local is configured.
  console.warn(
    "NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. " +
      "Authentication features will not work until these are configured in .env.local.",
  );
}

export const supabase = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseAnonKey ?? "placeholder-anon-key",
);
