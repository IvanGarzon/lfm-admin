-- Rename PDF-related columns to remove 'pdf_' prefix and add lastGeneratedAt
-- This migration preserves existing data by renaming columns

-- Rename columns
ALTER TABLE "invoices" RENAME COLUMN "pdf_file_name" TO "file_name";
ALTER TABLE "invoices" RENAME COLUMN "pdf_file_size" TO "file_size";
ALTER TABLE "invoices" RENAME COLUMN "pdf_mime_type" TO "mime_type";
ALTER TABLE "invoices" RENAME COLUMN "pdf_s3_key" TO "s3_key";
ALTER TABLE "invoices" RENAME COLUMN "pdf_s3_url" TO "s3_url";

-- Add new column for tracking when PDF was last generated
ALTER TABLE "invoices" ADD COLUMN "last_generated_at" TIMESTAMPTZ;

-- For existing records with PDF data, set last_generated_at to created_at
UPDATE "invoices"
SET "last_generated_at" = "created_at"
WHERE "s3_key" IS NOT NULL;
