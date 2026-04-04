-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "tenant_id" TEXT;

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_settings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "logo_url" TEXT,
    "abn" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "bank_name" TEXT,
    "bsb" TEXT,
    "account_number" TEXT,
    "account_name" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" "States",
    "postcode" TEXT,
    "country" TEXT DEFAULT 'Australia',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tenant_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "tenants_slug_idx" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "tenants_status_idx" ON "tenants"("status");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_settings_tenant_id_key" ON "tenant_settings"("tenant_id");

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_settings" ADD CONSTRAINT "tenant_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: create Las Flores Melbourne as the first tenant
INSERT INTO "tenants" ("id", "slug", "name", "status", "created_at", "updated_at")
VALUES (
  'lfm_tenant_seed_001',
  'las-flores-melbourne',
  'Las Flores Melbourne',
  'ACTIVE',
  NOW(),
  NOW()
);

-- Backfill: create tenant settings for Las Flores Melbourne
INSERT INTO "tenant_settings" (
  "id", "tenant_id",
  "abn", "email", "phone",
  "bank_name", "bsb", "account_number", "account_name",
  "country", "created_at", "updated_at"
)
VALUES (
  'lfm_tenant_settings_001',
  'lfm_tenant_seed_001',
  '39586352580',
  'lasfloresmelb@gmail.com',
  '0451001507',
  'Commonwealth Bank',
  '063-162',
  '1073 0539',
  'Las Flores Melbourne',
  'Australia',
  NOW(),
  NOW()
);

-- Backfill: assign all existing users to the Las Flores Melbourne tenant
UPDATE "users" SET "tenant_id" = 'lfm_tenant_seed_001' WHERE "tenant_id" IS NULL;
