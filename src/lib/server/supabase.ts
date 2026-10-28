import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "./env";

/** Read-only client using the public anon key. Row level security limits it to published content. */
export function anonClient(): SupabaseClient {
  return createClient(serverEnv.supabaseUrl, serverEnv.supabaseAnonKey, { auth: { persistSession: false } });
}

/**
 * Service-role client. Bypasses row level security, so it must only be used in
 * server code for narrowly scoped writes (feedback) and the seed script.
 */
export function serviceClient(): SupabaseClient {
  if (!serverEnv.serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(serverEnv.supabaseUrl, serverEnv.serviceRoleKey, { auth: { persistSession: false } });
}
