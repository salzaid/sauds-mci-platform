# Docker Installation Guide — Saud's MCI Platform

This guide explains how to run the MCI Platform as a self-contained Docker stack on any machine that has Docker installed.

---

## Prerequisites

| Requirement | Minimum version | Notes |
|---|---|---|
| Docker Engine | 24.x | [Install guide](https://docs.docker.com/engine/install/) |
| Docker Compose | v2 (plugin) | Bundled with Docker Desktop; `docker compose` (no hyphen) |
| RAM | 1 GB free | MySQL + Node.js |
| Disk | 2 GB free | Image layers + database volume |

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/salzaid/sauds-mci-platform.git
cd sauds-mci-platform
```

### 2. Create your environment file

```bash
cp .env.example .env
```

Open `.env` in a text editor and set at minimum:

```dotenv
# Generate a strong secret:  openssl rand -hex 64
JWT_SECRET=<paste output here>

# Change the database passwords from the defaults
MYSQL_ROOT_PASSWORD=<strong password>
MYSQL_PASSWORD=<strong password>
```

All other variables are optional for a standalone deployment (Manus OAuth, Forge API, analytics).

### 3. Start the stack

```bash
docker compose up -d
```

Docker will:
1. Pull the MySQL 8.4 image.
2. Build the MCI Platform image (compiles the React frontend and Express server).
3. Start MySQL, wait for it to be healthy, then start the app.
4. Apply all database migrations automatically on first boot.

### 4. Open the platform

Navigate to **http://localhost:3000** (or the server's IP if running remotely).

The first time you visit, the database is empty. Use the **Request Access** form on the landing page, then log in to the admin panel to approve the request and create your first user — or use the admin panel to create users directly.

---

## Stopping and Starting

```bash
# Stop (preserves data)
docker compose stop

# Start again
docker compose start

# Stop and remove containers (preserves data volume)
docker compose down

# Stop, remove containers AND wipe the database
docker compose down -v
```

---

## Rebuilding After Code Changes

If you modify the source code and want to rebuild the image:

```bash
docker compose up -d --build
```

---

## Running on a Remote Server

If you are deploying on a Linux server (e.g., a VPS or cloud VM), the steps are identical. After `docker compose up -d`, the platform is accessible at `http://<server-ip>:3000`.

To serve it over HTTPS with a domain name, place a reverse proxy (Nginx or Caddy) in front of port 3000. A minimal Caddy example:

```
your.domain.com {
    reverse_proxy localhost:3000
}
```

---

## Persisting Data

All MySQL data is stored in a named Docker volume (`mysql_data`). It survives container restarts and `docker compose down`. To back it up:

```bash
docker run --rm \
  -v mci-platform_mysql_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/mci-db-backup.tar.gz -C /data .
```

To restore:

```bash
docker run --rm \
  -v mci-platform_mysql_data:/data \
  -v $(pwd):/backup \
  alpine sh -c "rm -rf /data/* && tar xzf /backup/mci-db-backup.tar.gz -C /data"
```

---

## Environment Variable Reference

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | **Yes** | Signs JWT session cookies. Use `openssl rand -hex 64`. |
| `MYSQL_ROOT_PASSWORD` | **Yes** | MySQL root password. |
| `MYSQL_DATABASE` | No | Database name (default: `mci_platform`). |
| `MYSQL_USER` | No | App DB user (default: `mci_user`). |
| `MYSQL_PASSWORD` | No | App DB password (default: `mci_password`). |
| `APP_PORT` | No | Host port to expose (default: `3000`). |
| `VITE_APP_ID` | No | Manus OAuth app ID (for OAuth fallback login). |
| `OAUTH_SERVER_URL` | No | Manus OAuth backend URL. |
| `VITE_OAUTH_PORTAL_URL` | No | Manus OAuth portal URL. |
| `OWNER_OPEN_ID` | No | Manus owner open ID. |
| `OWNER_NAME` | No | Manus owner display name. |
| `BUILT_IN_FORGE_API_URL` | No | Manus Forge API URL (for LLM/storage features). |
| `BUILT_IN_FORGE_API_KEY` | No | Manus Forge API key. |
| `VITE_FRONTEND_FORGE_API_KEY` | No | Frontend Forge API key. |
| `VITE_FRONTEND_FORGE_API_URL` | No | Frontend Forge API URL. |
| `VITE_ANALYTICS_ENDPOINT` | No | Umami analytics endpoint. |
| `VITE_ANALYTICS_WEBSITE_ID` | No | Umami website ID. |

---

## Troubleshooting

**App container exits immediately**
Run `docker compose logs app` to see the error. The most common cause is a missing or invalid `JWT_SECRET`.

**"MySQL did not become ready" error**
The MySQL container is taking longer than 60 seconds to initialise (common on slow disks). Run `docker compose up -d` again — it will resume from where it stopped.

**Port 3000 already in use**
Set `APP_PORT=3001` (or any free port) in your `.env` file.

**Migrations fail with "Table already exists"**
This is harmless — the migration scripts use `CREATE TABLE IF NOT EXISTS` so re-running them is safe.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Docker host                                        │
│                                                     │
│  ┌──────────────────┐    ┌───────────────────────┐  │
│  │  app (Node 22)   │───▶│  db (MySQL 8.4)       │  │
│  │  port 3000       │    │  volume: mysql_data   │  │
│  │                  │    │                       │  │
│  │  React SPA       │    │  16 tables            │  │
│  │  Express + tRPC  │    │  Drizzle ORM          │  │
│  └──────────────────┘    └───────────────────────┘  │
│           │                                         │
│    host port (APP_PORT)                             │
└─────────────────────────────────────────────────────┘
```

The `app` container serves both the compiled React frontend (as static files) and the Express/tRPC API on the same port. No separate web server is required.

---

## Licence

MIT — Saud N Alzaid, 2026
