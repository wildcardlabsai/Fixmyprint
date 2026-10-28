-- Visual symptom library, resin (MSLA) printers and printing-technology filters.

-- Every image the site can show, where it came from and what it depicts.
-- A photograph is only "available" with a named creator, licence and source.
create table visual_assets (
  id text primary key,
  kind text not null check (kind in ('photo', 'illustration')),
  status text not null check (status in ('available', 'missing')),
  file text,
  width int check (width > 0),
  height int check (height > 0),
  alt text not null,
  subject text not null,
  creator text,
  licence text,
  source_url text,
  attribution text,
  notes text,
  check (status = 'missing' or (file is not null and width is not null and height is not null)),
  check (status = 'missing' or kind = 'illustration' or (creator is not null and licence is not null and source_url is not null))
);

alter table visual_assets enable row level security;
create policy "visual_assets: public read" on visual_assets for select using (true);
create policy "visual_assets: editors write" on visual_assets for all using (is_editor()) with check (is_editor());

-- Printing technology: 'fdm' (filament) or 'msla' (resin).
alter table symptom_categories add column if not exists printer_types text[] not null default '{fdm}';
alter table symptoms add column if not exists printer_types text[] not null default '{fdm}';
alter table diagnostic_flows add column if not exists printer_types text[] not null default '{fdm}';
alter table repair_guides add column if not exists printer_types text[] not null default '{fdm}';
alter table maintenance_tasks add column if not exists printer_types text[] not null default '{fdm}';

-- Images, in order of preference, and the answers a symptom already gives in its flow.
alter table symptoms add column if not exists images text[] not null default '{}';
alter table symptoms add column if not exists preset jsonb not null default '{}';
alter table diagnostic_answer_options add column if not exists image text references visual_assets (id) on delete set null;
alter table repair_steps add column if not exists image text references visual_assets (id) on delete set null;

alter table maintenance_tasks drop constraint if exists maintenance_tasks_area_check;
alter table maintenance_tasks add constraint maintenance_tasks_area_check
  check (area in ('build-surface', 'motion', 'extrusion', 'electrical', 'firmware', 'frame', 'resin-vat'));
