/**
 * Environment Variables Mock
 *
 * Provides mock environment variables for testing.
 */

export const env = {
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  NODE_ENV: 'test',
  NEXTAUTH_SECRET: 'test-secret',
  AUTH_SECRET: 'test-secret',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  AWS_REGION: 'ap-southeast-2',
  AWS_ACCESS_KEY_ID: 'test',
  AWS_SECRET_ACCESS_KEY: 'test',
  AWS_S3_BUCKET_NAME: 'test',
  AWS_ENDPOINT_URL: 'http://localhost:4566',
  RESEND_API_KEY: 're_test',
  CRON_SECRET: 'test',
  INNGEST_APP_ID: 'test',
  AUTH_TRUST_HOST: true,
} as const;
