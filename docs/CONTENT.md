# Writing and reviewing content

All content lives in `src/content` as typed data validated by the Zod schemas in `src/lib/schema`. The interface renders whatever is there, so adding a printer, flow or guide never needs a component change.

After any change run:

```bash
npm run content:check   # schemas, references, cycles, reachability
npm test                # includes exhaustive path tests for every flow
```

When content is served from Supabase, bump `CONTENT_VERSION` in `src/content/index.ts` and run `npm run db:seed`.

## Ground rules

- **Do not guess.** If a specification cannot be confirmed from a manufacturer source, leave it `null`. The interface shows it as "Not yet verified" and the diagnostic engine asks the user instead.
- **Cite sources.** Every printer, flow, guide and reference record lists `sourceIds` from `src/content/shared.ts`. Add a source there first. Link to manufacturer documentation rather than copying it.
- **Never mark your own work verified.** New records use `seedVerification()` (status `unreviewed`). Only a second person changes the status, sets `reviewedBy` and `lastReviewed`, and for printers sets `lastVerified`.
- **Safety first.** Steps involving heat, motion, wiring or firmware list the relevant `safety` ids. Never write a step that disables or weakens thermal protection, works on mains wiring, or exceeds a manufacturer's limits. Refer electrical faults beyond low-voltage connectors to the manufacturer or a qualified technician.
- **Plain language.** Short sentences, no marketing phrases. Explain why a step matters.

## Review statuses

| Status | Meaning |
| --- | --- |
| `draft` | Incomplete. Hidden from the public by row level security. |
| `unreviewed` | Complete and published, not yet checked by a second person. |
| `reviewed` | An editor has checked it against every cited source. |
| `verified` | Checked against primary sources and, where it matters, tested on the hardware. |

When reviewing, record any limitations in `knownLimitations`. In the database, each review also adds a row to `content_verifications`, and edits can be recorded in `content_revisions`.

## Adding a printer

Add a record to the manufacturer's file in `src/content/printers/`. The fields that drive the diagnostic engine are `levelling`, `extruder`, `enclosure`, `motionSystem`, `linearMotion`, `firmwareFamily`, `bed.surfaceKind` and `multiMaterial`. Getting `levelling` right matters most, because it changes the questions, checks and guide steps people see:

- `manual`: knobs or screws, no sensor.
- `probe-offset`: a separate probe (inductive, BLTouch-style) with a user-set Z offset.
- `nozzle-sensing`: the nozzle itself detects the bed (load cell, strain gauge, force sensing).
- `automatic`: the printer levels itself, but the manufacturer does not publish how. Use this rather than guessing a sensor type.

Printer records live in `src/content/printers/`, one file per manufacturer, built with the `printer()` helper. List every manufacturer page you took figures from in `sources`; they are shown on the printer page with the date they were read. Put any conflicts or gaps in the manufacturer's own figures in `gaps` and leave the field blank.

Hardware revisions that change behaviour (for example different mainboards needing different firmware) go in `variants`.

## Adding or changing a diagnostic flow

Create a file in `src/content/flows` and add it to `flows/index.ts`. A flow has:

- `questions`: each with a `prompt`, a `why` (shown to the user), and `options`.
- `options[].next`: a question id, `"result"`, or `{ branch: [{ when, goto }], otherwise }`. The first matching branch wins.
- `options[].evidence`: `{ outcomeId: weight }`. Use +1 to +5 for support and negative values to count against a cause. Reserve larger weights for unambiguous safety outcomes.
- `options[].facts`: facts the answer establishes, such as `{ filament: "petg" }` or `{ "printer.levelling": "manual" }`.
- `autoAnswer`: lets the selected printer answer the question. Only map values that are unambiguous.
- `rules`: evidence added when a condition holds, with a `reason` that is shown to the user.
- `outcomes`: the possible causes, with `checks` (strings, or `{ text, when }` for hardware-specific checks), `guideSlugs`, `safety`, `escalation` and optional `notApplicableWhen`.
- `insufficient`: what to tell the user when nothing scores high enough.

Mark answers like "Not sure" with `uncertain: true` and give them little or no evidence.

The tests walk every possible path through every flow and fail if a path does not finish, a question is unreachable, a cause can never be suggested, or a path asks more than eight questions. Increase `version` whenever you change question or option ids, so saved sessions from the old version are discarded rather than replayed.

## Adding a repair guide

Add a record to `src/content/guides.ts`. Steps that only apply to some hardware take `appliesWhen` and an `appliesLabel` (for example "Manual beds"). Add a `hardwareSelector` for the fact those steps depend on, so people without a saved printer can choose. When hardware is unknown, conditional steps are shown and labelled rather than hidden.

Only use diagrams that are schematic and labelled as such. Do not present a photograph of one printer's part as another model's part.

## Slicers

Slicers live in `src/content/slicers.ts`.

- `settings` maps a setting key to the name exactly as it appears in the slicer, its menu location if documented, and the developer's page that gives it. Only add names from the developer's own documentation. Leave a key out rather than guess; the interface then shows the parent project's name (marked as not confirmed) or "Not documented".
- `basedOn` is the slicer it was forked from, only when its developer says so.
- `usedBy` links the slicer to printers. Use `official` for the manufacturer's own slicer and `supported` when the manufacturer names it or publishes profiles for it. Leave `printerSlugs` empty only if the statement covers every model from that manufacturer, and always give the manufacturer's page as `sourceUrl`.
- To point a diagnostic cause or guide at slicer settings, add the keys to its `slicerSettings`. To add a new key, extend `slicerSettingKeySchema` and `SLICER_SETTING_LABELS` in `src/lib/schema/slicer.ts`.

## Filament, maintenance and parts

- Filament ranges are general starting points. Add manufacturer data sheets under `manufacturerProfiles` with their source URL; do not merge them into the general range.
- Maintenance tasks can be limited to hardware with `appliesWhen`. Only recommend lubricants and intervals the manufacturer specifies.
- Parts are component types with compatibility notes. Link only to manufacturer pages, never to products we cannot vouch for, and keep compatibility `unverified` until checked against a manufacturer parts listing.
