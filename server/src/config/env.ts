import dotenv from 'dotenv';

dotenv.config();

/**
 * Typed, validated environment configuration.
 *
 * All access to `process.env` happens here. The rest of the app imports
 * `config` and gets a plain, well-typed object. This avoids `process.env.X`
 * scattered through the codebase (always `string | undefined`) and centralizes
 * defaults.
 */

function parsePort(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error(`Invalid PORT value: "${raw}"`);
  }
  return parsed;
}

function parseNodeEnv(raw: string | undefined): 'development' | 'production' | 'test' {
  if (raw === 'production' || raw === 'test') return raw;
  return 'development';
}

function parseCorsOrigin(raw: string | undefined): string | string[] {
  if (!raw || raw === '*') return '*';
  const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return parts.length === 1 ? parts[0]! : parts;
}

export const config = {
  port: parsePort(process.env.PORT, 3001),
  nodeEnv: parseNodeEnv(process.env.NODE_ENV),
  corsOrigin: parseCorsOrigin(process.env.CORS_ORIGIN),
} as const;

export type AppConfig = typeof config;
