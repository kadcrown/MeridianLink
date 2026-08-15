import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().default('file:./dev.db'),
  OWNER_EMAIL: z.string().email().default('owner@meridianlink.local'),
  OWNER_INITIAL_PASSWORD: z.string().min(8).default('ChangeMeInProd123!'),
  APP_SECRET: z.string().min(16).default('meridianlink_production_secure_master_key_random_seed_9876543210'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  TRUSTED_PROXY_HEADERS: z.string().default('CF-IPCountry,X-Geo-Country,X-Vercel-IP-Country,Fly-Client-IP-Country'),
  DATA_RETENTION_DAYS: z.coerce.number().default(90),
  SALT_ROTATION_INTERVAL_HOURS: z.coerce.number().default(24),
  ENABLE_BOT_FILTERING: z.coerce.boolean().default(true),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  AMAZON_PAAPI_ACCESS_KEY: z.string().optional(),
  AMAZON_PAAPI_SECRET_KEY: z.string().optional(),
  AMAZON_PAAPI_PARTNER_TAG: z.string().optional(),
});

export const env = envSchema.parse(process.env);
