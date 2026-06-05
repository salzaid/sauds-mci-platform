#!/bin/sh
# docker-entrypoint.sh
# Waits for MySQL to be ready, applies Drizzle migrations, then starts the app.
set -e

# ── helpers ──────────────────────────────────────────────────────────────────
log() { echo "[entrypoint] $*"; }

# Parse host/port from DATABASE_URL
# Expected format: mysql://user:pass@host:port/dbname
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|mysql://[^@]+@([^:/]+).*|\1|')
DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|mysql://[^@]+@[^:]+:([0-9]+).*|\1|')
DB_PORT=${DB_PORT:-3306}

# ── wait for MySQL ────────────────────────────────────────────────────────────
log "Waiting for MySQL at ${DB_HOST}:${DB_PORT} ..."
MAX_TRIES=60
TRIES=0
until mysqladmin ping -h "$DB_HOST" -P "$DB_PORT" --silent 2>/dev/null; do
  TRIES=$((TRIES + 1))
  if [ "$TRIES" -ge "$MAX_TRIES" ]; then
    log "ERROR: MySQL did not become ready after ${MAX_TRIES} seconds. Aborting."
    exit 1
  fi
  sleep 1
done
log "MySQL is ready."

# ── run migrations ────────────────────────────────────────────────────────────
log "Applying database migrations ..."

# Extract connection details from DATABASE_URL for mysql CLI
DB_USER=$(echo "$DATABASE_URL" | sed -E 's|mysql://([^:]+):.*|\1|')
DB_PASS=$(echo "$DATABASE_URL" | sed -E 's|mysql://[^:]+:([^@]+)@.*|\1|')
DB_NAME=$(echo "$DATABASE_URL" | sed -E 's|.*/([^?]+).*|\1|')

# Apply each migration SQL file in order (idempotent via IF NOT EXISTS / CREATE TABLE IF NOT EXISTS)
for sql_file in /app/drizzle/0*.sql; do
  if [ -f "$sql_file" ]; then
    log "  → $(basename "$sql_file")"
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$sql_file" 2>&1 || true
  fi
done

log "Migrations complete."

# ── start the application ─────────────────────────────────────────────────────
log "Starting MCI Platform server ..."
exec "$@"
