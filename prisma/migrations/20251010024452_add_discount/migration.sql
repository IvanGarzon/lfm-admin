-- AlterTable
ALTER TABLE "public"."invoices" ADD COLUMN     "discount" MONEY NOT NULL DEFAULT 0,
ADD COLUMN     "gst" DECIMAL(5,2) NOT NULL DEFAULT 10;
