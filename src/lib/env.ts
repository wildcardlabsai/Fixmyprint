/**
 * Public configuration. Safe to import from client components: it only reads
 * NEXT_PUBLIC_ variables. Server-only secrets live in lib/server/env.ts.
 */
export const publicEnv = {
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
};

export const SITE_NAME = "FixMyPrint";
