-- Slicer software, the manufacturer statements linking slicers to printers,
-- and the slicer settings each diagnostic outcome and repair guide refers to.

create table slicers (
  slug text primary key,
  name text not null unique,
  developer text not null,
  aliases text[] not null default '{}',
  former_names text[] not null default '{}',
  based_on text references slicers (slug) on delete set null deferrable initially deferred,
  lineage text,
  open_source boolean,
  licence text,
  platforms text[] not null default '{}',
  url text not null,
  summary text not null,
  -- {"retraction": {"name": ..., "location": ..., "note": ..., "sourceUrl": ...}, ...}
  settings jsonb not null default '{}',
  calibration_tools jsonb not null default '[]',
  notes text[] not null default '{}',
  sources jsonb not null default '[]',
  review_status review_status not null default 'draft',
  author text not null,
  reviewed_by_name text,
  last_reviewed date,
  verification_notes text,
  known_limitations text[] not null default '{}',
  updated_at timestamptz not null default now(),
  check (based_on is null or based_on <> slug)
);

create table slicer_links (
  slicer_slug text not null references slicers (slug) on delete cascade,
  position int not null,
  manufacturer_slug text not null references manufacturers (slug) on delete cascade,
  -- Empty means every model from the manufacturer.
  printer_slugs text[] not null default '{}',
  relation text not null check (relation in ('official', 'supported')),
  note text,
  source_url text not null,
  primary key (slicer_slug, position)
);
create index slicer_links_manufacturer_idx on slicer_links (manufacturer_slug);

alter table diagnostic_outcomes add column if not exists slicer_settings text[] not null default '{}';
alter table repair_guides add column if not exists slicer_settings text[] not null default '{}';

alter table slicers enable row level security;
alter table slicer_links enable row level security;

create policy "slicers: public read published" on slicers for select using (review_status <> 'draft' or is_editor());
create policy "slicers: editors write" on slicers for all using (is_editor()) with check (is_editor());
create policy "slicer_links: public read" on slicer_links for select using (true);
create policy "slicer_links: editors write" on slicer_links for all using (is_editor()) with check (is_editor());
