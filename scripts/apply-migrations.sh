#!/usr/bin/env bash
set -euo pipefail

# Use DB_URL (from workflow env) or SUPABASE_DB_URL
CONN="${DB_URL:-${SUPABASE_DB_URL:-}}"

if [[ -z "$CONN" ]]; then
  echo "ERROR: require DB_URL or SUPABASE_DB_URL environment variable containing the Postgres connection string."
  exit 1
fi

echo "Applying migrations from supabase/migrations..."
for f in supabase/migrations/*.sql; do
  if [[ -f "$f" ]]; then
    echo "--- Applying $f"
    psql "$CONN" -v ON_ERROR_STOP=1 -f "$f"
  fi
done

echo "Migrations applied successfully."