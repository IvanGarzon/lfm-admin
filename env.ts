import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    // This is optional because it's only used in development.
    // See https://next-auth.js.org/deployment.
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    NEXTAUTH_URL: z.url().optional(),
    NEXTAUTH_SECRET: z.string().min(1),
    AUTH_TRUST_HOST: z
      .string()
      .refine((s) => s === 'true' || s === 'false')
      .transform((s) => s === 'true'),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    AUTH_SECRET: z.string().min(1),
    DATABASE_URL: z.string().min(1),
    OPTIMIZE_API_KEY: z.string().min(1),
    USE_ADAPTER: z
      .string()
      .refine((s) => s === 'true' || s === 'false')
      .transform((s) => s === 'true'),

    AWS_REGION: z.string().min(1),
    AWS_ACCESS_KEY_ID: z.string().min(1),
    AWS_SECRET_ACCESS_KEY: z.string().min(1),
    AWS_S3_BUCKET_NAME: z.string().min(1),
    AWS_ENDPOINT_URL: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().min(1),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.AUTH_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    AUTH_SECRET: process.env.AUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    OPTIMIZE_API_KEY: process.env.OPTIMIZE_API_KEY,
    USE_ADAPTER: process.env.USE_ADAPTER,
    AUTH_TRUST_HOST: process.env.USE_ADAPTER,
    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,
    AWS_ENDPOINT_URL: process.env.AWS_ENDPOINT_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  },
});
