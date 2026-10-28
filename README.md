# FixMyPrint

An independent 3D printer troubleshooting and repair platform. People choose their printer, describe what is happening, answer questions that adapt to their answers, get a ranked list of likely causes with the reasoning behind each, and follow interactive repair guides. If a repair does not work, they go back to the diagnosis and move on to the next cause.

FixMyPrint is not affiliated with any printer manufacturer.

## Quick start

Requires Node.js 20.9 or later.

```bash
npm install
npm run dev          # http://localhost:3000
```

No environment variables or database are needed. Without Supabase, all content comes from the versioned seed in `src/content`, progress is saved in the browser, and feedback forms say plainly that reports were not stored.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint (Next.js core web vitals and TypeScript rules) |
| `npm run typecheck` | TypeScript in strict mode |
| `npm test` | Unit and component tests (Vitest, Testing Library) |
| `npm run test:e2e` | End-to-end tests (Playwright, desktop and mobile). Run `npm run build` first. |
| `npm run content:check` | Validates all content: schemas plus cross-references, cycles and reachability |
| `npm run test:db` | Applies the migrations to a throwaway Postgres database, loads all seed content through them and runs the row level security tests. Needs `DATABASE_URL`. |
| `npm run db:seed` | Upserts the seed content into Supabase. Needs the service role key. |

## Environment variables

Copy `.env.example` to `.env.local`. Everything is optional.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Base URL for canonical links, the sitemap and robots.txt |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project. The anon key is public by design; row level security limits it to published content. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only. Used by `/api/feedback` to store reports and by `npm run db:seed`. Never prefix with `NEXT_PUBLIC_`. |
| `CONTENT_SOURCE` | `local` (default) reads the bundled seed. `supabase` reads published content from the database, cached for ten minutes, falling back to the bundled seed (with a logged error) if the database cannot be read. |

## Setting up Supabase

1. Create a project and apply `supabase/migrations/*.sql` (with the Supabase CLI, `supabase db push`, or the SQL editor).
2. Set the variables above and run `npm run db:seed`.
3. To let someone edit content, set their `profiles.role` to `editor` or `admin` using the SQL editor or service role. Roles cannot be changed from the public API.
4. Optionally set `CONTENT_SOURCE=supabase`.

What is stored where:

- **Content** (printers, flows, guides, filament, maintenance, parts, error messages, sources) can be read by anyone when not in `draft`. Only `editor` and `admin` profiles can write it.
- **Feedback** is inserted by the server with the service role. Only editors and admins can read it.
- **Saved printers, diagnostic sessions and repair history** tables exist for signed-in users, scoped to their own rows. The current release has no sign-in, so the app keeps these on the device only (see below).

## Architecture

```
src/
  app/                 Routes (App Router). Pages are statically generated from content.
  components/          UI, grouped by feature (diagnose, guides, printers, ...)
  content/             Versioned seed content, validated with Zod at load time
    flows/             One file per diagnostic flow
  lib/
    schema/            Zod schemas: the single definition of every content type
    engine/            The diagnostic rules engine (pure, no React)
    data/              Repository (local or Supabase), row mapping, selectors
    search/            Search index and matching
    client/            Browser-only helpers (local storage, feedback)
    server/            Server-only helpers (secrets, Supabase clients)
supabase/
  migrations/          Schema, indexes, constraints and row level security
  tests/               Database tests run by scripts/test-db.sh
scripts/               Seed, content check and database test scripts
e2e/                   Playwright tests
```

### The diagnostic engine

Diagnostic flows are data, not components. A flow is a set of questions; each answer option declares where to go next (a question, a conditional branch, or the result) and how much evidence it adds for or against each possible cause. Flows can also declare rules that combine answers with printer facts, for example "ABS on an open-frame printer adds evidence for shrinkage".

`evaluate(flow, answers, facts)` in `src/lib/engine/engine.ts` walks the tree from the start, applies stored answers, fills in answers that the selected printer's specifications settle (`autoAnswer`), stops at the first unanswered question, and scores every cause from the answers on the path taken. It is pure and deterministic.

- Printer facts come only from recorded specifications. An unknown specification is never treated as a fact; conditions use three-valued logic so that unknown facts never exclude advice.
- Users can override a printer-derived answer, for example after fitting a different probe.
- Changing an earlier answer clears the answers after it. Answers that are no longer on the path are ignored.
- Causes scoring 2 or more are shown, ranked by score. Labels come from fixed thresholds: *Strong match* (6 or more and at least 3 ahead of the next), *Likely* (4 or more), *Possible*. These are not probabilities and no percentages are shown.
- If nothing reaches the threshold, the result asks for a specific check instead of guessing.
- "Still not fixed" marks a cause as tried and the next one is shown.
- Recommended checks and guide steps can carry hardware conditions, so a printer with load-cell levelling is not told to turn levelling knobs.

No AI model is involved, and nothing depends on an API key.

### Persistence

Without accounts, the browser's local storage holds the saved printer, in-progress diagnoses (keyed by flow and version, so content updates do not replay stale answers), guide progress and repair results. Nothing in local storage is sent to the server. The database schema already includes per-user tables for when sign-in is added.

### Security

- Secrets are read only in `src/lib/server`, which imports `server-only`.
- `/api/feedback` validates with Zod, rejects cross-origin posts, has a honeypot field, a size limit and a per-instance rate limit. Put a shared rate limiter in front of it in multi-instance deployments.
- Row level security is enabled on every table and tested by `npm run test:db`. A trigger stops anyone but an admin changing roles.
- Security headers are set in `next.config.ts`.

### Search

`src/lib/search/search.ts` builds an in-memory index of printers, symptoms, error messages, guides, filament, maintenance and parts. It matches model names however they are typed (`ender3v2`, `Ender-3 V2`), aliases, UK and US spellings, prefixes and small typos, and requires every query word to match something.

## Content

See [docs/CONTENT.md](docs/CONTENT.md) for how to add printers, flows and guides, and for the review process. In short: every record is validated on load, `npm run content:check` catches broken references, unreachable questions and causes that can never be suggested, and every seeded record starts as *not yet reviewed*.

### What is in the first release

- 10 printer models across 5 manufacturers, with unconfirmed specifications left blank. 11 manufacturers in total; those without records are listed as not yet documented.
- 10 diagnostic flows covering every symptom category (77 questions, 100 possible causes).
- 11 repair guides, 8 filament profiles, 12 maintenance tasks, 4 parts and 13 firmware error messages.

All of it is marked **not yet reviewed**. It was written from manufacturer and firmware documentation and established practice, but has not been checked by a second person. Printer specifications in particular should be confirmed against the linked manufacturer pages before being promoted.

## Not included yet

- Accounts and sign-in (the schema and policies are ready), and an admin editing interface. Content is edited in `src/content` or directly in the database by editors.
- Offline use or installation as an app. A manifest and caching strategy were deliberately left out until content can actually be used offline.
- Photographs. Guides use two schematic diagrams labelled as such; no image is presented as a specific model's hardware.
