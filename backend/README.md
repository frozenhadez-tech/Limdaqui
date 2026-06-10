# Limdaqui Backend

A Node + Express REST API written in TypeScript (ESM), backed by Postgres
(Neon) via Drizzle ORM. Built as the backend for an e-commerce site.

## Requirements

- Node.js 18+ (20+ recommended)
- A Postgres database (Neon)

## Setup

```bash
npm install
cp .env.example .env   # then set DATABASE_URL and other values
npm run db:migrate     # apply migrations to the database
```

## Scripts

| Script               | Description                                       |
| -------------------- | ------------------------------------------------- |
| `npm run dev`        | Start the dev server with watch/reload (tsx)      |
| `npm run build`      | Compile TypeScript to `dist/`                     |
| `npm start`          | Run the compiled server from `dist/`              |
| `npm run typecheck`  | Type-check without emitting                       |
| `npm run db:generate`| Generate SQL migrations from `src/db/schema.ts`   |
| `npm run db:migrate` | Apply pending migrations to the database          |
| `npm run db:push`    | Push the schema directly (quick dev sync)         |
| `npm run db:studio`  | Open Drizzle Studio to browse data                |

## Database workflow

The schema lives in [`src/db/schema.ts`](src/db/schema.ts). After editing it:

```bash
npm run db:generate   # writes a new SQL migration under ./drizzle
npm run db:migrate    # applies it to the database
```

Current tables: `users`, `categories`, `products`, `orders`, `order_items`.
Money is stored as integer cents (e.g. `price_cents`) to avoid float issues.

## Project structure

```
src/
  config/      env loading & validation
  db/          Drizzle schema, client, and migrator
  middleware/  shared Express middleware (error handling)
  routes/      route modules, mounted under /api
  app.ts       Express app factory
  index.ts     server bootstrap
drizzle/       generated SQL migrations (committed)
```

## Endpoints

- `GET /api/health`    — service health check.
- `GET /api/health/db` — verifies database connectivity.

## Notes

Add resource routes under `src/routes/` and mount them in
`src/routes/index.ts`. Never commit `.env` — it holds the database
credentials and is gitignored.
