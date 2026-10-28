-- Printers whose manufacturer does not publish how they level the bed are
-- recorded as 'automatic', so manual-levelling advice is never shown for them.
alter table printer_specifications drop constraint if exists printer_specifications_levelling_check;
alter table printer_specifications add constraint printer_specifications_levelling_check
  check (levelling in ('manual', 'probe-offset', 'nozzle-sensing', 'automatic'));

-- The manufacturer pages each printer's specifications were taken from:
-- [{"label": ..., "url": ..., "accessed": "YYYY-MM-DD"}].
alter table printer_models add column if not exists spec_sources jsonb not null default '[]';

-- Hardware a whole repair guide applies to (for example, only printers with a Z offset).
alter table repair_guides add column if not exists applies_when jsonb;
