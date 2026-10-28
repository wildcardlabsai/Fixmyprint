import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { parseContent, seed, type SeedContent } from "@/content";
import { readsContentFromSupabase } from "@/lib/server/env";
import { anonClient } from "@/lib/server/supabase";
import { rowsToContent, TABLE_ORDER, type TableRows } from "./rows";

export type Content = SeedContent & { origin: "bundled" | "database" };

async function loadFromSupabase(): Promise<SeedContent> {
  const db = anonClient();
  const entries = await Promise.all(
    TABLE_ORDER.map(async (table) => {
      const { data, error } = await db.from(table).select("*");
      if (error) throw new Error(`Failed to read ${table}: ${error.message}`);
      return [table, data ?? []] as const;
    }),
  );
  return parseContent(rowsToContent(Object.fromEntries(entries) as TableRows), "database");
}

const cachedDatabaseContent = unstable_cache(loadFromSupabase, ["fixmyprint-content"], { revalidate: 600, tags: ["content"] });

/**
 * All public content. The data set is small, so it is loaded once and cached
 * rather than queried page by page. When the database is selected but cannot be
 * read, the bundled seed is served and the failure is logged.
 */
export const getContent = cache(async (): Promise<Content> => {
  if (readsContentFromSupabase()) {
    try {
      return { ...(await cachedDatabaseContent()), origin: "database" };
    } catch (error) {
      console.error("[content] Falling back to bundled content:", error);
    }
  }
  return { ...seed, origin: "bundled" };
});
