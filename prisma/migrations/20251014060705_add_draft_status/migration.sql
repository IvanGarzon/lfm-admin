-- AlterEnum
ALTER TYPE "public"."InvoiceStatus" ADD VALUE 'DRAFT';

-- AlterTable
ALTER TABLE "public"."invoices" ALTER COLUMN "status" DROP DEFAULT;
