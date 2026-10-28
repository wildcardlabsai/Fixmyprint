import "server-only";
import { publicEnv } from "@/lib/env";

export const serverEnv = {
  ...publicEnv,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  contentSource: process.env.CONTENT_SOURCE === "supabase" ? "supabase" : "local",
} as const;

/** Content can be read from Supabase only when explicitly selected and configured. */
export const readsContentFromSupabase = () =>
  serverEnv.contentSource === "supabase" && Boolean(serverEnv.supabaseUrl && serverEnv.supabaseAnonKey);

/** Feedback is stored only when the server has a service role key. */
export const canStoreFeedback = () => Boolean(serverEnv.supabaseUrl && serverEnv.serviceRoleKey);
