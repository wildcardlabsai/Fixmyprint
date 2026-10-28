-- FixMyPrint initial schema.
--
-- Content tables use stable, human-readable keys (slugs) as primary keys so that
-- content can be reviewed, diffed and re-seeded without ID translation.
-- User-generated tables use UUIDs.
--
-- Access model:
--   * Public (anon + authenticated) can read published content (review_status <> 'draft').
--   * Only profiles with role 'editor' or 'admin' can write content.
--   * Users can manage their own saved printers, sessions and repair history.
--   * Feedback is inserted by the server using the service role; nobody can read it
--     except editors and admins.

create extension if not exists pgcrypto;

-- Review status shared by all content -------------------------------------------
create type review_status as enum ('draft', 'unreviewed', 'reviewed', 'verified');
create type user_role as enum ('member', 'editor', 'admin');

-- Profiles and authorisation ------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  role user_role not null default 'member',
  created_at timestamptz not null default now()
);

create or replace function is_editor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('editor', 'admin'));
$$;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- Only admins may change roles. Enforced with a trigger rather than column
-- privileges alone, because a later blanket GRANT would silently undo those.
-- Server-side maintenance with the service role (no auth.uid()) is allowed.
create or replace function protect_profile_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not is_admin() then
    raise exception 'Only administrators can change roles';
  end if;
  return new;
end;
$$;
create trigger protect_profile_role before update on profiles
  for each row execute function protect_profile_role();

-- Create a profile row for every new auth user.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Columns every content table carries.
-- (Repeated per table rather than inherited, so each table stays self-describing.)

-- Sources and safety ------------------------------------------------------------
create table source_references (
  id text primary key,
  title text not null,
  publisher text not null,
  url text,
  kind text not null check (kind in ('manufacturer-docs', 'manufacturer-site', 'firmware-docs', 'standards', 'editorial')),
  note text
);

create table safety_notices (
  id text primary key,
  title text not null,
  body text not null,
  level text not null check (level in ('caution', 'warning', 'danger'))
);

-- Polymorphic link from any content record to its sources.
create table content_sources (
  entity_type text not null,
  entity_key text not null,
  source_id text not null references source_references (id) on delete restrict,
  position int not null default 0,
  primary key (entity_type, entity_key, source_id)
);
create index content_sources_source_idx on content_sources (source_id);

-- Verification history and revisions --------------------------------------------
create table content_verifications (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_key text not null,
  status review_status not null,
  reviewed_by uuid references profiles (id) on delete set null,
  reviewer_name text,
  notes text,
  known_limitations text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index content_verifications_entity_idx on content_verifications (entity_type, entity_key, created_at desc);

create table content_revisions (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_key text not null,
  revision int not null,
  data jsonb not null,
  edited_by uuid references profiles (id) on delete set null,
  summary text,
  created_at timestamptz not null default now(),
  unique (entity_type, entity_key, revision)
);

-- Manufacturers and printers ----------------------------------------------------
create table manufacturers (
  slug text primary key,
  name text not null unique,
  website text,
  support_url text,
  aliases text[] not null default '{}'
);

create table printer_models (
  slug text primary key,
  manufacturer_slug text not null references manufacturers (slug) on delete restrict,
  name text not null,
  family text,
  aliases text[] not null default '{}',
  summary text not null,
  documentation jsonb not null default '[]',
  troubleshooting_notes jsonb not null default '[]',
  confidence_notes text not null,
  last_verified date,
  review_status review_status not null default 'draft',
  author text not null,
  reviewed_by_name text,
  last_reviewed date,
  verification_notes text,
  known_limitations text[] not null default '{}',
  updated_at timestamptz not null default now(),
  unique (manufacturer_slug, name)
);
create index printer_models_manufacturer_idx on printer_models (manufacturer_slug);
create index printer_models_aliases_idx on printer_models using gin (aliases);

-- One row per printer. Commonly filtered fields are real columns; the rest of the
-- specification lives in `details` so new hardware attributes need no migration.
-- NULL means "not verified", never "none".
create table printer_specifications (
  printer_slug text primary key references printer_models (slug) on delete cascade,
  printer_type text not null default 'fdm',
  motion_system text check (motion_system in ('bed-slinger', 'corexy', 'delta', 'other')),
  linear_motion text check (linear_motion in ('v-slot-wheels', 'smooth-rods', 'linear-rails', 'mixed')),
  build_x_mm numeric,
  build_y_mm numeric,
  build_z_mm numeric,
  hotend_max_temp_c int check (hotend_max_temp_c > 0),
  enclosure text check (enclosure in ('open', 'enclosed', 'optional')),
  levelling text check (levelling in ('manual', 'probe-offset', 'nozzle-sensing')),
  extruder text check (extruder in ('direct', 'bowden')),
  firmware_family text check (firmware_family in ('marlin', 'klipper', 'prusa', 'bambu', 'other')),
  details jsonb not null default '{}'
);
create index printer_specifications_levelling_idx on printer_specifications (levelling);

create table printer_variants (
  printer_slug text not null references printer_models (slug) on delete cascade,
  slug text not null,
  name text not null,
  kind text not null check (kind in ('hardware-revision', 'bundle', 'regional', 'other')),
  description text not null,
  spec_overrides jsonb not null default '{}',
  position int not null default 0,
  primary key (printer_slug, slug)
);

-- Symptoms ------------------------------------------------------------------------
create table symptom_categories (
  slug text primary key,
  title text not null,
  description text not null,
  icon text not null,
  position int not null default 0
);

-- Diagnostic flows: versioned. Questions, options and outcomes belong to one version.
create table diagnostic_flows (
  key text not null,
  version int not null check (version > 0),
  title text not null,
  summary text not null,
  category_slug text not null references symptom_categories (slug),
  start_question text not null,
  entry_conditions jsonb,
  safety text[] not null default '{}',
  insufficient jsonb not null,
  review_status review_status not null default 'draft',
  author text not null,
  reviewed_by_name text,
  last_reviewed date,
  verification_notes text,
  known_limitations text[] not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (key, version)
);
create index diagnostic_flows_category_idx on diagnostic_flows (category_slug);

create table symptoms (
  slug text primary key,
  category_slug text not null references symptom_categories (slug),
  title text not null,
  description text not null,
  synonyms text[] not null default '{}',
  flow_key text,
  common boolean not null default false,
  position int not null default 0
);
create index symptoms_category_idx on symptoms (category_slug);

create table diagnostic_flow_symptoms (
  flow_key text not null,
  flow_version int not null,
  symptom_slug text not null references symptoms (slug) on delete cascade,
  primary key (flow_key, flow_version, symptom_slug),
  foreign key (flow_key, flow_version) references diagnostic_flows (key, version) on delete cascade
);

create table diagnostic_questions (
  flow_key text not null,
  flow_version int not null,
  key text not null check (key <> 'result'),
  position int not null,
  prompt text not null,
  why text not null,
  help text,
  auto_answer jsonb,
  skip_when jsonb,
  skip_to text,
  safety text[] not null default '{}',
  primary key (flow_key, flow_version, key),
  foreign key (flow_key, flow_version) references diagnostic_flows (key, version) on delete cascade
);

create table diagnostic_outcomes (
  flow_key text not null,
  flow_version int not null,
  key text not null,
  position int not null,
  title text not null,
  summary text not null,
  explanation text not null,
  -- Array of strings or {"text", "when"} objects for hardware-specific checks.
  checks jsonb not null,
  safety text[] not null default '{}',
  escalation text,
  not_applicable_when jsonb,
  primary key (flow_key, flow_version, key),
  foreign key (flow_key, flow_version) references diagnostic_flows (key, version) on delete cascade
);

create table diagnostic_answer_options (
  flow_key text not null,
  flow_version int not null,
  question_key text not null,
  key text not null,
  position int not null,
  label text not null,
  detail text,
  -- Branching rule: a question key, 'result', or {"branch": [{when, goto}], "otherwise": key}.
  next jsonb not null,
  facts jsonb not null default '{}',
  uncertain boolean not null default false,
  primary key (flow_key, flow_version, question_key, key),
  foreign key (flow_key, flow_version, question_key)
    references diagnostic_questions (flow_key, flow_version, key) on delete cascade
);

create table diagnostic_option_evidence (
  flow_key text not null,
  flow_version int not null,
  question_key text not null,
  option_key text not null,
  outcome_key text not null,
  weight int not null check (weight between -10 and 10 and weight <> 0),
  primary key (flow_key, flow_version, question_key, option_key, outcome_key),
  foreign key (flow_key, flow_version, question_key, option_key)
    references diagnostic_answer_options (flow_key, flow_version, question_key, key) on delete cascade,
  foreign key (flow_key, flow_version, outcome_key)
    references diagnostic_outcomes (flow_key, flow_version, key) on delete cascade
);

create table diagnostic_rules (
  flow_key text not null,
  flow_version int not null,
  key text not null,
  position int not null,
  condition jsonb not null,
  reason text not null,
  primary key (flow_key, flow_version, key),
  foreign key (flow_key, flow_version) references diagnostic_flows (key, version) on delete cascade
);

create table diagnostic_rule_evidence (
  flow_key text not null,
  flow_version int not null,
  rule_key text not null,
  outcome_key text not null,
  weight int not null check (weight between -10 and 10 and weight <> 0),
  primary key (flow_key, flow_version, rule_key, outcome_key),
  foreign key (flow_key, flow_version, rule_key)
    references diagnostic_rules (flow_key, flow_version, key) on delete cascade,
  foreign key (flow_key, flow_version, outcome_key)
    references diagnostic_outcomes (flow_key, flow_version, key) on delete cascade
);

-- Repair guides -----------------------------------------------------------------
create table repair_guides (
  slug text primary key,
  title text not null,
  summary text not null,
  problem text not null,
  category_slug text not null references symptom_categories (slug),
  applies_note text not null,
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  time_min_minutes int,
  time_max_minutes int,
  tools text[] not null default '{}',
  safety text[] not null default '{}',
  hardware_selector jsonb,
  settings jsonb not null default '[]',
  expected_result text not null,
  verification_steps text[] not null,
  if_fails jsonb not null,
  review_status review_status not null default 'draft',
  author text not null,
  reviewed_by_name text,
  last_reviewed date,
  verification_notes text,
  known_limitations text[] not null default '{}',
  updated_at timestamptz not null default now(),
  check (time_min_minutes is null or time_max_minutes is null or time_min_minutes <= time_max_minutes)
);
create index repair_guides_category_idx on repair_guides (category_slug);

create table repair_steps (
  guide_slug text not null references repair_guides (slug) on delete cascade,
  key text not null,
  position int not null,
  title text not null,
  body text[] not null,
  applies_when jsonb,
  applies_label text,
  warning text,
  tip text,
  safety text[] not null default '{}',
  diagram text,
  primary key (guide_slug, key),
  unique (guide_slug, position)
);

create table guide_symptoms (
  guide_slug text not null references repair_guides (slug) on delete cascade,
  symptom_slug text not null references symptoms (slug) on delete cascade,
  primary key (guide_slug, symptom_slug)
);

create table guide_printers (
  guide_slug text not null references repair_guides (slug) on delete cascade,
  printer_slug text not null references printer_models (slug) on delete cascade,
  primary key (guide_slug, printer_slug)
);

create table symptom_guides (
  symptom_slug text not null references symptoms (slug) on delete cascade,
  guide_slug text not null references repair_guides (slug) on delete cascade,
  position int not null default 0,
  primary key (symptom_slug, guide_slug)
);

create table diagnostic_outcome_guides (
  flow_key text not null,
  flow_version int not null,
  outcome_key text not null,
  guide_slug text not null references repair_guides (slug) on delete cascade,
  position int not null default 0,
  primary key (flow_key, flow_version, outcome_key, guide_slug),
  foreign key (flow_key, flow_version, outcome_key)
    references diagnostic_outcomes (flow_key, flow_version, key) on delete cascade
);

-- Filament, maintenance and parts -----------------------------------------------
create table filament_profiles (
  slug text primary key,
  name text not null,
  full_name text not null,
  aliases text[] not null default '{}',
  material_group text not null check (material_group in ('standard', 'engineering', 'flexible', 'reinforced')),
  summary text not null,
  nozzle_min_c int not null,
  nozzle_max_c int not null,
  bed_min_c int,
  bed_max_c int,
  fan_min_percent int not null,
  fan_max_percent int not null,
  enclosure text not null check (enclosure in ('not-needed', 'helpful', 'recommended', 'required')),
  moisture text not null check (moisture in ('low', 'moderate', 'high', 'very-high')),
  drying jsonb,
  abrasive boolean not null,
  requires_hardened_nozzle boolean not null,
  direct_drive_preferred boolean not null,
  bed_surface_notes text not null,
  printing_notes text[] not null default '{}',
  safety_notes text[] not null default '{}',
  safety text[] not null default '{}',
  manufacturer_profiles jsonb not null default '[]',
  review_status review_status not null default 'draft',
  author text not null,
  reviewed_by_name text,
  last_reviewed date,
  verification_notes text,
  known_limitations text[] not null default '{}',
  updated_at timestamptz not null default now(),
  check (nozzle_min_c <= nozzle_max_c),
  check (bed_min_c is null or bed_max_c is null or bed_min_c <= bed_max_c)
);

create table maintenance_tasks (
  slug text primary key,
  title text not null,
  summary text not null,
  area text not null check (area in ('build-surface', 'motion', 'extrusion', 'electrical', 'firmware', 'frame')),
  interval_label text not null,
  sort_hours numeric not null default 0,
  applies_when jsonb,
  applies_label text,
  tools text[] not null default '{}',
  steps text[] not null,
  cautions text[] not null default '{}',
  safety text[] not null default '{}',
  guide_slugs text[] not null default '{}',
  review_status review_status not null default 'draft',
  author text not null,
  reviewed_by_name text,
  last_reviewed date,
  verification_notes text,
  known_limitations text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table parts (
  slug text primary key,
  name text not null,
  category text not null check (category in ('nozzle', 'hotend', 'extruder', 'build-surface', 'motion', 'tubing', 'electronics', 'other')),
  description text not null,
  specs jsonb not null default '[]',
  replacement_guide_slug text references repair_guides (slug) on delete set null,
  supplier jsonb,
  review_status review_status not null default 'draft',
  author text not null,
  reviewed_by_name text,
  last_reviewed date,
  verification_notes text,
  known_limitations text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table part_compatibility (
  part_slug text not null references parts (slug) on delete cascade,
  printer_slug text not null references printer_models (slug) on delete cascade,
  status text not null check (status in ('manufacturer-listed', 'reported', 'unverified')),
  note text,
  primary key (part_slug, printer_slug)
);
create index part_compatibility_printer_idx on part_compatibility (printer_slug);

create table guide_parts (
  guide_slug text not null references repair_guides (slug) on delete cascade,
  position int not null,
  name text not null,
  part_slug text references parts (slug) on delete set null,
  optional boolean not null default false,
  primary key (guide_slug, position)
);

create table error_codes (
  slug text primary key,
  message text not null,
  aliases text[] not null default '{}',
  firmware_family text not null check (firmware_family in ('marlin', 'klipper', 'prusa', 'bambu', 'other')),
  firmware_label text not null,
  meaning text not null,
  first_steps text[] not null,
  flow_key text,
  safety text[] not null default '{}',
  review_status review_status not null default 'draft',
  author text not null,
  reviewed_by_name text,
  last_reviewed date,
  verification_notes text,
  known_limitations text[] not null default '{}',
  updated_at timestamptz not null default now()
);
create index error_codes_aliases_idx on error_codes using gin (aliases);

-- User data -----------------------------------------------------------------------
create table saved_printers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  printer_slug text not null references printer_models (slug) on delete cascade,
  variant_slug text,
  nickname text check (char_length(nickname) <= 80),
  created_at timestamptz not null default now(),
  unique (user_id, printer_slug, variant_slug)
);

create table diagnostic_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles (id) on delete cascade,
  flow_key text not null,
  flow_version int not null,
  printer_slug text references printer_models (slug) on delete set null,
  answers jsonb not null default '{}',
  tried text[] not null default '{}',
  status text not null check (status in ('in-progress', 'diagnosed', 'insufficient')),
  top_outcome_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index diagnostic_sessions_user_idx on diagnostic_sessions (user_id, updated_at desc);

create table repair_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles (id) on delete cascade,
  session_id uuid references diagnostic_sessions (id) on delete set null,
  guide_slug text not null references repair_guides (slug) on delete cascade,
  outcome_key text,
  result text not null check (result in ('fixed', 'not-fixed', 'abandoned')),
  completed_steps text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index repair_history_user_idx on repair_history (user_id, created_at desc);

create table feedback (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('incorrect-diagnosis', 'content-error', 'repair-result', 'contact')),
  message text check (char_length(message) <= 4000),
  context jsonb not null default '{}',
  page text check (char_length(page) <= 500),
  contact_email text check (char_length(contact_email) <= 254),
  user_id uuid references profiles (id) on delete set null,
  status text not null default 'new' check (status in ('new', 'triaged', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);
create index feedback_status_idx on feedback (status, created_at desc);

-- Current (latest non-draft) version of each flow.
create view current_diagnostic_flows with (security_invoker = true) as
  select distinct on (key) * from diagnostic_flows
  where review_status <> 'draft'
  order by key, version desc;

-- Row level security ------------------------------------------------------------
alter table profiles enable row level security;
alter table source_references enable row level security;
alter table safety_notices enable row level security;
alter table content_sources enable row level security;
alter table content_verifications enable row level security;
alter table content_revisions enable row level security;
alter table manufacturers enable row level security;
alter table printer_models enable row level security;
alter table printer_specifications enable row level security;
alter table printer_variants enable row level security;
alter table symptom_categories enable row level security;
alter table symptoms enable row level security;
alter table diagnostic_flows enable row level security;
alter table diagnostic_flow_symptoms enable row level security;
alter table diagnostic_questions enable row level security;
alter table diagnostic_outcomes enable row level security;
alter table diagnostic_answer_options enable row level security;
alter table diagnostic_option_evidence enable row level security;
alter table diagnostic_rules enable row level security;
alter table diagnostic_rule_evidence enable row level security;
alter table diagnostic_outcome_guides enable row level security;
alter table repair_guides enable row level security;
alter table repair_steps enable row level security;
alter table guide_symptoms enable row level security;
alter table guide_printers enable row level security;
alter table symptom_guides enable row level security;
alter table guide_parts enable row level security;
alter table filament_profiles enable row level security;
alter table maintenance_tasks enable row level security;
alter table parts enable row level security;
alter table part_compatibility enable row level security;
alter table error_codes enable row level security;
alter table saved_printers enable row level security;
alter table diagnostic_sessions enable row level security;
alter table repair_history enable row level security;
alter table feedback enable row level security;

-- Profiles: users read and rename themselves; only admins change roles.
create policy "profiles: read own" on profiles for select using (id = auth.uid() or is_admin());
create policy "profiles: admins manage" on profiles for all using (is_admin()) with check (is_admin());
revoke update on profiles from authenticated;
grant update (display_name) on profiles to authenticated;
create policy "profiles: update own name" on profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- Public read of published content; editor write. Tables with a review_status
-- only expose non-draft rows to the public.
do $$
declare
  t text;
begin
  foreach t in array array[
    'printer_models', 'diagnostic_flows', 'repair_guides', 'filament_profiles',
    'maintenance_tasks', 'parts', 'error_codes'
  ] loop
    execute format('create policy "%1$s: public read published" on %1$I for select using (review_status <> ''draft'' or is_editor())', t);
    execute format('create policy "%1$s: editors write" on %1$I for all using (is_editor()) with check (is_editor())', t);
  end loop;

  foreach t in array array[
    'source_references', 'safety_notices', 'content_sources', 'manufacturers', 'printer_specifications',
    'printer_variants', 'symptom_categories', 'symptoms', 'diagnostic_flow_symptoms', 'diagnostic_questions',
    'diagnostic_outcomes', 'diagnostic_answer_options', 'diagnostic_option_evidence', 'diagnostic_rules',
    'diagnostic_rule_evidence', 'diagnostic_outcome_guides', 'repair_steps', 'guide_symptoms',
    'guide_printers', 'symptom_guides', 'guide_parts', 'part_compatibility'
  ] loop
    execute format('create policy "%1$s: public read" on %1$I for select using (true)', t);
    execute format('create policy "%1$s: editors write" on %1$I for all using (is_editor()) with check (is_editor())', t);
  end loop;
end $$;

create policy "content_verifications: editors" on content_verifications for all using (is_editor()) with check (is_editor());
create policy "content_revisions: editors" on content_revisions for all using (is_editor()) with check (is_editor());

-- User-owned data.
create policy "saved_printers: own" on saved_printers for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "diagnostic_sessions: own" on diagnostic_sessions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "repair_history: own" on repair_history for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Feedback: no public policies. The server inserts with the service role.
create policy "feedback: editors read and triage" on feedback for select using (is_editor());
create policy "feedback: editors update" on feedback for update using (is_editor()) with check (is_editor());
