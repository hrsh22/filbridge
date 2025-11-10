import { z } from 'zod';
import type { AutoFiConfig, Environment } from '../types.js';
import { ConfigError } from '../errors.js';

const envSchema = z.object({
  AUTOFI_ENV: z.union([z.literal('development'), z.literal('production')]).default('development'),
  PIN_ENDPOINT: z.string().optional(),
  PIN_TOKEN: z.string().optional(),
});

export function readConfigFromEnv(env: NodeJS.ProcessEnv = process.env): AutoFiConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    throw new ConfigError(`Invalid environment: ${parsed.error.message}`);
  }
  const data = parsed.data;
  const config: AutoFiConfig = {
    env: data.AUTOFI_ENV as Environment,
    pin: data.PIN_ENDPOINT && data.PIN_TOKEN ? { endpoint: data.PIN_ENDPOINT, token: data.PIN_TOKEN } : undefined,
  };
  return config;
}


