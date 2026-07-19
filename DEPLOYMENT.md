# JEE PYQ Vault — Deployment Guide

## Overview

JEE PYQ Vault is a Next.js 16 application with **61,991 questions** stored in a **SQLite database** (`db/custom.db`). This document covers deployment strategies for **Render** (primary) and **Cloudflare Pages** (secondary/CDN).

---

## Architecture Constraints

| Constraint | Detail |
|---|---|
| **Database** | SQLite via Prisma ORM — file-based, needs persistent disk |
| **Runtime** | Next.js 16 with App Router, standalone output mode |
| **Package Manager** | Bun (also compatible with npm/node) |
| **Auth** | NextAuth.js v4 (requires `NEXTAUTH_SECRET`) |
| **APIs** | REST API routes under `/api/*` |

### Why SQLite Makes Deployment Tricky

SQLite is a file-based database. Most serverless/free-tier platforms use **ephemeral filesystems** — on each deploy or cold start, the disk is wiped clean. This means:

- **Cloudflare Pages** — Ephemeral, no persistent disk. SQLite will lose all data on every deploy.
- **Render Free Tier** — Persistent disk is available on the free web service plan. SQLite works.
- **Vercel Free Tier** — Ephemeral. SQLite will not persist.

**Recommendation: Use Render as the primary deployment target.**

---

## Option A: Render (Recommended — Primary Deployment)

Render's free web service tier provides:
- Persistent disk (the SQLite DB survives restarts)
- Auto-deploy from GitHub
- Built-in SSL
- Health checks

### Step-by-Step Setup

#### 1. Push to GitHub

The repo is already at: `github.com/mayankpalj5819-rgb/exam-questions-app`

#### 2. Create Render Service

1. Go to [render.com](https://render.com) and sign in with GitHub.
2. Click **New** → **Blueprint**.
3. Connect the `exam-questions-app` repository.
4. Render will auto-detect `render.yaml` and configure the service.

Or create manually:
1. **New** → **Web Service** → Select the repo.
2. Set the following:
   - **Runtime**: Node
   - **Build Command**: `npx prisma generate && bun install && bun run build`
   - **Start Command**: `bun run start`
   - **Plan**: Free

#### 3. Environment Variables

| Variable | Value | Notes |
|---|---|---|
| `NODE_VERSION` | `20` | Required for correct Node runtime |
| `DATABASE_URL` | `file:./db/custom.db` | Path to SQLite file |
| `NEXTAUTH_SECRET` | (auto-generated) | Set in Render dashboard |
| `NEXTAUTH_URL` | `https://your-app.onrender.com` | Auto-set by render.yaml |

#### 4. Database Seeding

Since `db/custom.db` is in `.gitignore` (too large for Git), you need to seed the database after the first deploy:

1. **Option 1 — Upload the DB file directly**:
   - Use Render's shell: `Dashboard → your service → Shell`
   - Upload `custom.db` to the `db/` directory using `scp` or the Render web shell.

2. **Option 2 — Seed via API**:
   - Push the seed script to the repo and run it in the Render shell.
   - The existing `scripts/import-scraped.ts` can be adapted.

3. **Option 3 — Use a GitHub Release**:
   - Upload `custom.db` as a GitHub Release asset.
   - Add a post-build step to download and extract it.

#### 5. Health Check

The `render.yaml` includes `healthCheckPath: /api` which hits the root API endpoint. Render will use this to determine if the service is healthy.

#### 6. Free Tier Limitations

- **Cold starts**: The service spins down after 15 minutes of inactivity. First request may take ~30s.
- **Disk**: 1 GB persistent disk (sufficient for 61K questions ~50MB).
- **RAM**: 512 MB.
- **No custom domains** on free tier.

---

## Option B: Cloudflare Pages (Secondary — CDN / Redirect)

Cloudflare Pages is designed for **static sites + edge functions**. It does **NOT** support:
- Persistent filesystem (SQLite will be wiped on each deploy)
- Long-running Node.js server processes
- Prisma with SQLite

### Strategy B1: Static Export with JSON Data (Best for Cloudflare)

Export all questions as static JSON and build a fully static site.

**Pros**: Fast global CDN, free, no cold starts.
**Cons**: Loses auth, saved questions, and any dynamic features.

**Implementation**:
1. Export questions from SQLite to JSON files (per-subject or per-chapter).
2. Use Next.js `output: "export"` mode for a fully static build.
3. Fetch questions client-side from the JSON files.
4. Deploy to Cloudflare Pages.

The project already has a `scripts/export-static.ts` script and a `static-deploy/` folder with pre-exported data.

**Steps**:
```bash
# 1. Generate static JSON from DB
bun run scripts/export-static.ts

# 2. Change next.config.ts to output: "export"
# 3. Build the static site
bun run build

# 4. Deploy the `out/` directory to Cloudflare Pages
```

### Strategy B2: Cloudflare as CDN/Redirect to Render

Use Cloudflare Pages as a thin redirect layer:

1. Deploy a minimal Cloudflare Pages project with a `_redirects` file.
2. All traffic redirects to the Render URL.
3. Benefit: Custom domain on Cloudflare, faster DNS, DDoS protection.

**`_redirects` file**:
```
/*  https://jee-pyq-vault.onrender.com/:splat  302
```

Or use Cloudflare Workers for smarter routing:
- Static assets served from Cloudflare CDN.
- Dynamic requests proxied to Render.

### Strategy B3: Cloudflare + Turso (D1)

For a fully Cloudflare-native solution:
1. Migrate from SQLite to **Cloudflare D1** (SQLite-compatible, serverless).
2. Use Cloudflare Pages with Functions as the API layer.
3. This requires rewriting the database layer (Prisma doesn't natively support D1).

**This is a significant refactor and not recommended for initial deployment.**

---

## Recommended Deployment Plan

```
┌─────────────────────────────────────┐
│         GitHub Repository           │
│   mayankpalj5819-rgb/exam-questions │
└──────────────┬──────────────────────┘
               │  auto-deploy
               ▼
┌─────────────────────────────────────┐
│     Render (Free Web Service)       │
│  - Next.js 16 standalone server     │
│  - SQLite DB (persistent disk)      │
│  - Full API + Auth + Save features  │
│  - URL: *.onrender.com              │
└──────────────┬──────────────────────┘
               │  optional: Cloudflare proxy
               ▼
┌─────────────────────────────────────┐
│  Cloudflare Pages (Optional)        │
│  - Custom domain                    │
│  - CDN caching for static assets    │
│  - Redirects dynamic traffic to     │
│    Render backend                   │
└─────────────────────────────────────┘
```

**Phase 1** (Now): Deploy to Render using `render.yaml`. Upload DB manually.
**Phase 2** (Later): Set up Cloudflare as CDN/reverse proxy for custom domain + caching.
**Phase 3** (Optional): Create a static export for offline/CDN-only access.

---

## Dockerfile (Alternative to Render Blueprint)

A `Dockerfile` is included in the project root for environments where `render.yaml` blueprint detection isn't used. Render can also use this Dockerfile directly by selecting "Docker" as the environment.

---

## Troubleshooting

### "No Questions Found" after deploy
- The `db/custom.db` file was not uploaded. Follow the Database Seeding steps above.

### Cold start delays (30s+)
- This is expected on Render free tier. The service spins down after 15 min of inactivity.
- Use a cron job uptime monitor (e.g., UptimeRobot) to ping the health endpoint every 5 minutes.

### Build fails with "prisma generate" error
- Ensure `NODE_VERSION=20` is set in environment variables.
- The build command runs `npx prisma generate` before `bun install`.

### Port binding error
- Render sets the `PORT` environment variable automatically. The standalone Next.js server respects this.