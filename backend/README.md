# Limdaqui Backend

A Node + Express REST API written in TypeScript (ESM).

## Requirements

- Node.js 18+ (20+ recommended)

## Setup

```bash
npm install
cp .env.example .env   # then edit values as needed
```

## Scripts

| Script              | Description                                  |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Start the dev server with watch/reload (tsx) |
| `npm run build`     | Compile TypeScript to `dist/`                |
| `npm start`         | Run the compiled server from `dist/`         |
| `npm run typecheck` | Type-check without emitting                  |

## Project structure

```
src/
  config/      env loading & validation
  middleware/  shared Express middleware (error handling)
  routes/      route modules, mounted under /api
  app.ts       Express app factory
  index.ts     server bootstrap
```

## Endpoints

- `GET /api/health` — service health check.

## Notes

This project is independent of the `arsenal` frontend; add resource routes
under `src/routes/` and mount them in `src/routes/index.ts`.
