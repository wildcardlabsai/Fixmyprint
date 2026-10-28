-- Row level security checks. Run with scripts/test-db.sh against a throwaway
-- Postgres database. Fails (non-zero exit) if any expectation is not met.
\set ON_ERROR_STOP 1
-- Supabase grants table privileges to these roles by default; mirror that.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;

insert into auth.users values ('00000000-0000-0000-0000-000000000001'), ('00000000-0000-0000-0000-000000000002');
update profiles set role = 'editor' where id = '00000000-0000-0000-0000-000000000002';
update printer_models set review_status = 'draft' where slug = 'flashforge-adventurer-5m';
update slicers set review_status = 'draft' where slug = 'flashprint';
insert into feedback (kind, message) values ('contact', 'hello');

create function pg_temp.expect(ok boolean, label text) returns void language plpgsql as $$
begin
  if not ok then raise exception 'FAILED: %', label; end if;
  raise notice 'ok: %', label;
end $$;

create function pg_temp.fails(stmt text) returns boolean language plpgsql as $$
begin
  execute stmt;
  return false;
exception when others then
  return true;
end $$;

-- Anonymous visitors
set role anon;
select pg_temp.expect((select count(*) from printer_models) = (select count(*) from printer_models where review_status <> 'draft'), 'anon sees only published printers');
select pg_temp.expect(not exists (select 1 from printer_models where slug = 'flashforge-adventurer-5m'), 'anon cannot see drafts');
select pg_temp.expect((select count(*) from feedback) = 0, 'anon cannot read feedback');
select pg_temp.expect(exists (select 1 from slicers where slug = 'orcaslicer') and not exists (select 1 from slicers where slug = 'flashprint'), 'anon sees published slicers but not drafts');
select pg_temp.expect(exists (select 1 from slicer_links), 'anon can read slicer links');
select pg_temp.expect(pg_temp.fails($$insert into slicer_links (slicer_slug, position, manufacturer_slug, relation, source_url) values ('orcaslicer', 99, 'creality', 'official', 'https://example.com')$$), 'anon cannot add slicer links');
select pg_temp.expect(pg_temp.fails($$insert into printer_models (slug, manufacturer_slug, name, summary, confidence_notes, author) values ('x','creality','X','x','x','x')$$), 'anon cannot insert content');
update printer_models set name = 'changed' where slug = 'creality-k1';
reset role;
select pg_temp.expect((select name from printer_models where slug = 'creality-k1') = 'K1', 'anon cannot update content');

-- Ordinary signed-in member
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
select pg_temp.expect(pg_temp.fails($$update profiles set role = 'admin' where id = '00000000-0000-0000-0000-000000000001'$$), 'member cannot change own role');
update profiles set display_name = 'Sam' where id = '00000000-0000-0000-0000-000000000001';
insert into saved_printers (user_id, printer_slug) values ('00000000-0000-0000-0000-000000000001', 'prusa-mk4');
select pg_temp.expect(pg_temp.fails($$insert into saved_printers (user_id, printer_slug) values ('00000000-0000-0000-0000-000000000002', 'prusa-mk4')$$), 'member cannot save printers for someone else');
update repair_guides set title = 'member edit' where slug = 'level-the-bed';
select pg_temp.expect((select count(*) from feedback) = 0, 'member cannot read feedback');

-- Editor
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
select pg_temp.expect((select title from repair_guides where slug = 'level-the-bed') = 'Level the bed', 'member cannot edit guides');
update repair_guides set title = 'Level the bed (edited)' where slug = 'level-the-bed';
select pg_temp.expect(exists (select 1 from printer_models where slug = 'flashforge-adventurer-5m'), 'editor can see drafts');
select pg_temp.expect((select count(*) from feedback) = 1, 'editor can read feedback');
select pg_temp.expect((select count(*) from saved_printers) = 0, 'editor cannot see other users'' saved printers');
reset role;

select pg_temp.expect((select title from repair_guides where slug = 'level-the-bed') = 'Level the bed (edited)', 'editor can edit guides');
select pg_temp.expect((select role from profiles where id = '00000000-0000-0000-0000-000000000001') = 'member', 'member role unchanged');
select pg_temp.expect((select display_name from profiles where id = '00000000-0000-0000-0000-000000000001') = 'Sam', 'member can rename themselves');
