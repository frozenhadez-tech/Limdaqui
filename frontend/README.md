# Limdaqui Frontend

Next.js (App Router, TypeScript, Tailwind CSS) storefront for Limdaqui.
Deployed on **Vercel**; talks to the Express API on **Google Cloud Run**.

## Requirements

- Node.js 18.18+ (20+ recommended)

## Setup

```bash
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL
npm run dev                  # http://localhost:3000
```

## Scripts

| Script              | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start the dev server (localhost:3000)|
| `npm run build`     | Production build                     |
| `npm start`         | Serve the production build           |
| `npm run typecheck` | Type-check without emitting          |

## Environment

| Variable              | Description                                     |
| --------------------- | ----------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API (Cloud Run in prod) |

`NEXT_PUBLIC_*` vars are exposed to the browser — never put secrets here.

## Deploying to Vercel

This frontend lives in the `frontend/` subdirectory of the repo. In the Vercel
project settings, set **Root Directory** to `frontend`. Vercel auto-detects
Next.js — no extra build config needed. Add `NEXT_PUBLIC_API_URL` (your Cloud
Run URL) as a Vercel environment variable.
