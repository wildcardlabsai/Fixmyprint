/**
 * Prints the seed content as SQL inserts, for loading into a test database.
 * Uses the same row mapping as the Supabase seed script.
 */
import { seed } from "../src/content";
import { contentToRows, TABLE_ORDER } from "../src/lib/data/rows";

const rows = contentToRows(seed);
const quote = (s: string) => `'${s.replace(/'/g, "''")}'`;
for (const table of TABLE_ORDER) {
  const data = rows[table];
  if (data.length === 0) continue;
  const cols = Object.keys(data[0]!).join(", ");
  console.log(`insert into ${table} (${cols}) select ${cols} from jsonb_populate_recordset(null::${table}, ${quote(JSON.stringify(data))}::jsonb);`);
}
