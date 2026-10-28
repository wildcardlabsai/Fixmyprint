/**
 * Pushes the bundled seed content into Supabase.
 *
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run db:seed
 *
 * Rows are upserted by primary key, so the script is safe to re-run. Rows for
 * content that has been removed from the seed are not deleted; remove them by
 * hand or with a migration. Run the migrations in supabase/migrations first.
 */
import { createClient } from "@supabase/supabase-js";
import { seed } from "../src/content";
import { checkContentIntegrity } from "../src/lib/content-integrity";
import { contentToRows, TABLE_ORDER } from "../src/lib/data/rows";

const PRIMARY_KEYS: Record<(typeof TABLE_ORDER)[number], string> = {
  source_references: "id",
  safety_notices: "id",
  manufacturers: "slug",
  printer_models: "slug",
  printer_specifications: "printer_slug",
  printer_variants: "printer_slug,slug",
  symptom_categories: "slug",
  diagnostic_flows: "key,version",
  symptoms: "slug",
  diagnostic_flow_symptoms: "flow_key,flow_version,symptom_slug",
  diagnostic_questions: "flow_key,flow_version,key",
  diagnostic_outcomes: "flow_key,flow_version,key",
  diagnostic_answer_options: "flow_key,flow_version,question_key,key",
  diagnostic_option_evidence: "flow_key,flow_version,question_key,option_key,outcome_key",
  diagnostic_rules: "flow_key,flow_version,key",
  diagnostic_rule_evidence: "flow_key,flow_version,rule_key,outcome_key",
  repair_guides: "slug",
  repair_steps: "guide_slug,key",
  guide_symptoms: "guide_slug,symptom_slug",
  guide_printers: "guide_slug,printer_slug",
  symptom_guides: "symptom_slug,guide_slug",
  diagnostic_outcome_guides: "flow_key,flow_version,outcome_key,guide_slug",
  filament_profiles: "slug",
  maintenance_tasks: "slug",
  parts: "slug",
  part_compatibility: "part_slug,printer_slug",
  guide_parts: "guide_slug,position",
  error_codes: "slug",
  slicers: "slug",
  slicer_links: "slicer_slug,position",
  content_sources: "entity_type,entity_key,source_id",
};

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to seed the database.");
    process.exit(1);
  }

  const problems = checkContentIntegrity(seed);
  if (problems.length) {
    console.error("Content has problems; fix them before seeding:\n" + problems.join("\n"));
    process.exit(1);
  }

  const db = createClient(url, key, { auth: { persistSession: false } });
  const rows = contentToRows(seed);
  for (const table of TABLE_ORDER) {
    const data = rows[table];
    if (data.length === 0) continue;
    // Repair steps have a unique position as well as a key; clear them first so reordering works.
    if (table === "repair_steps") {
      const { error } = await db.from(table).delete().in("guide_slug", seed.guides.map((g) => g.slug));
      if (error) throw new Error(`${table}: ${error.message}`);
    }
    const { error } = await db.from(table).upsert(data, { onConflict: PRIMARY_KEYS[table] });
    if (error) throw new Error(`${table}: ${error.message}`);
    console.log(`${table.padEnd(28)} ${data.length} rows`);
  }
  console.log(`Seeded content version ${seed.version}.`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
