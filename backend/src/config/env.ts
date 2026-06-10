import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(required("PORT", "4000")),
  nodeEnv: required("NODE_ENV", "development"),
  corsOrigin: required("CORS_ORIGIN", "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  databaseUrl: required("DATABASE_URL"),
} as const;

export const isProduction = env.nodeEnv === "production";
