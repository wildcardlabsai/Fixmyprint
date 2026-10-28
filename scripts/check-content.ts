/**
 * Validates all bundled content: schemas (on import) and cross-references.
 *   npm run content:check
 */
import { seed } from "../src/content";
import { checkContentIntegrity } from "../src/lib/content-integrity";

const problems = checkContentIntegrity(seed);
if (problems.length) {
  console.error(`${problems.length} problem(s):\n` + problems.map((p) => `  - ${p}`).join("\n"));
  process.exit(1);
}

const count = (label: string, n: number) => console.log(`${label.padEnd(18)} ${n}`);
count("Printers", seed.printers.length);
count("Diagnostic flows", seed.flows.length);
count("Questions", seed.flows.reduce((n, f) => n + f.questions.length, 0));
count("Outcomes", seed.flows.reduce((n, f) => n + f.outcomes.length, 0));
count("Repair guides", seed.guides.length);
count("Filaments", seed.filaments.length);
count("Maintenance tasks", seed.maintenance.length);
count("Parts", seed.parts.length);
count("Slicers", seed.slicers.length);
count("Error messages", seed.errorCodes.length);
console.log("Content is valid.");
