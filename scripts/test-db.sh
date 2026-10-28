#!/usr/bin/env bash
# Applies the migrations to a throwaway Postgres database, loads all seed
# content through them (exercising foreign keys and CHECK constraints) and runs
# the row level security tests.
#
#   DATABASE_URL=postgres://postgres@localhost:5432/postgres scripts/test-db.sh
#
# The script creates and drops a database called fixmyprint_test.
set -euo pipefail
cd "$(dirname "$0")/.."
: "${DATABASE_URL:?Set DATABASE_URL to a Postgres server you can create databases on}"
TEST_DB="fixmyprint_test"
ADMIN_URL="$DATABASE_URL"
TEST_URL="${DATABASE_URL%/*}/$TEST_DB"

psql "$ADMIN_URL" -qc "drop database if exists $TEST_DB" -c "create database $TEST_DB"
trap 'psql "$ADMIN_URL" -qc "drop database if exists $TEST_DB"' EXIT

# Roles are cluster-wide and may already exist; ignore those errors only.
psql "$TEST_URL" -q -f supabase/tests/00_supabase_stub.sql 2>&1 | grep -v "already exists" || true
for f in supabase/migrations/*.sql; do psql "$TEST_URL" -q -v ON_ERROR_STOP=1 -f "$f"; done
npx tsx scripts/emit-seed-sql.ts | psql "$TEST_URL" -q -1 -v ON_ERROR_STOP=1
psql "$TEST_URL" -q -o /dev/null -f supabase/tests/rls_test.sql
echo "Database tests passed."
