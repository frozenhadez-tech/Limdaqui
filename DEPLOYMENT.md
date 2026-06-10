# Limdaqui — Deployment

```
┌─────────────┐      HTTPS      ┌──────────────────┐     TCP/SSL     ┌──────────┐
│   Vercel    │ ──────────────▶ │  Google Cloud    │ ──────────────▶ │   Neon   │
│  (Next.js   │   NEXT_PUBLIC_  │  Run (Express +  │   DATABASE_URL  │ Postgres │
│  frontend)  │     API_URL     │  Drizzle API)    │                 │          │
└─────────────┘                 └──────────────────┘                 └──────────┘
```

| Layer    | Service          | Source dir  |
| -------- | ---------------- | ----------- |
| Frontend | Vercel           | `frontend/` |
| Backend  | Google Cloud Run | `backend/`  |
| Database | Neon Postgres    | —           |

---

## 1. Database (Neon)

Already provisioned. The schema is managed with Drizzle migrations in
`backend/drizzle/`. To apply migrations against Neon:

```bash
cd backend
npm run db:migrate    # uses DATABASE_URL from the environment
```

Run this whenever you add a migration (locally, in CI, or as a one-off
Cloud Run job) — **not** on every container start.

---

## 2. Backend → Google Cloud Run

The backend ships as a container (`backend/Dockerfile`). Cloud Run injects
`PORT` (8080); the app reads it automatically.

### One-time setup

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

### Grant build + runtime permissions to the default service account

Deploying from source runs Cloud Build as the **Compute Engine default
service account** (`PROJECT_NUMBER-compute@developer.gserviceaccount.com`).
On a new project it lacks the build role, which causes:

> `PERMISSION_DENIED: Build failed because the default service account is
> missing required IAM permissions.`

Grant it the builder role (and secret access, since the runtime service also
uses this account):

```bash
PROJECT_ID=YOUR_PROJECT_ID
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA}" --role="roles/cloudbuild.builds.builder"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA}" --role="roles/secretmanager.secretAccessor"
```

Wait ~60 seconds for IAM changes to propagate before deploying.

### Store the DB connection string as a secret (recommended)

```bash
echo -n "postgresql://USER:PASSWORD@HOST/DB?sslmode=require" \
  | gcloud secrets create limdaqui-database-url --data-file=-
```

### Deploy (build + deploy from source)

```bash
cd backend
gcloud run deploy limdaqui-api \
  --source . \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-secrets DATABASE_URL=limdaqui-database-url:latest \
  --set-env-vars NODE_ENV=production,CORS_ORIGIN=https://YOUR-APP.vercel.app
```

`gcloud run deploy --source .` builds the Dockerfile with Cloud Build and
deploys. The command prints the public service URL — use it as the frontend's
`NEXT_PUBLIC_API_URL`.

> Pick a region close to your Neon region (Neon here is `ap-southeast-1`, so
> `asia-southeast1` keeps DB latency low).

After deploy, verify:

```bash
curl https://YOUR-SERVICE-URL/api/health
curl https://YOUR-SERVICE-URL/api/health/db
```

---

## 3. Frontend → Vercel

1. Import the GitHub repo into Vercel.
2. Set **Root Directory** to `frontend` (the project is in a subdirectory).
3. Framework preset: **Next.js** (auto-detected).
4. Add an environment variable:
   - `NEXT_PUBLIC_API_URL` = the Cloud Run service URL from step 2.
5. Deploy. Vercel gives you a `https://YOUR-APP.vercel.app` URL.

Then update the backend's `CORS_ORIGIN` to that Vercel URL (re-run the
`gcloud run deploy` command, or `gcloud run services update`).

---

## Environment variables summary

| Variable              | Where        | Example                                |
| --------------------- | ------------ | -------------------------------------- |
| `DATABASE_URL`        | Cloud Run    | `postgresql://…neon.tech/neondb?…`     |
| `CORS_ORIGIN`         | Cloud Run    | `https://limdaqui.vercel.app`          |
| `NODE_ENV`            | Cloud Run    | `production`                           |
| `NEXT_PUBLIC_API_URL` | Vercel       | `https://limdaqui-api-xxxx.run.app`    |

Secrets (`DATABASE_URL`) live in the platform's secret store and in local
`.env` files only — never committed.
