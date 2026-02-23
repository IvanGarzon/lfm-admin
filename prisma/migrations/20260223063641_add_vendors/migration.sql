-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "vendor_id" TEXT;

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "vendor_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "abn" TEXT,
    "status" "VendorStatus" NOT NULL DEFAULT 'ACTIVE',
    "address1" TEXT,
    "address2" TEXT,
    "city" TEXT,
    "region" TEXT,
    "postal_code" TEXT,
    "country" TEXT DEFAULT 'Australia',
    "website" TEXT,
    "payment_terms" INTEGER DEFAULT 30,
    "tax_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vendors_vendor_code_key" ON "vendors"("vendor_code");

-- CreateIndex
CREATE INDEX "vendors_status_idx" ON "vendors"("status");

-- CreateIndex
CREATE INDEX "vendors_email_idx" ON "vendors"("email");

-- CreateIndex
CREATE INDEX "vendors_vendor_code_idx" ON "vendors"("vendor_code");

-- CreateIndex
CREATE INDEX "vendors_status_deleted_at_idx" ON "vendors"("status", "deleted_at");

-- CreateIndex
CREATE INDEX "vendors_name_idx" ON "vendors"("name");

-- CreateIndex
CREATE INDEX "transactions_vendor_id_idx" ON "transactions"("vendor_id");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
