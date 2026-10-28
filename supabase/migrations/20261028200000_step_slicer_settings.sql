-- Slicer settings an individual repair step changes, shown inline in that step.
alter table repair_steps add column if not exists slicer_settings text[] not null default '{}';
