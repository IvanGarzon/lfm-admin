-- AlterEnum: ADD VALUE must run outside a transaction on PostgreSQL.
-- This file intentionally contains no BEGIN/COMMIT — Prisma will not wrap it.
ALTER TYPE "TenantStatus" ADD VALUE IF NOT EXISTS 'PENDING';
