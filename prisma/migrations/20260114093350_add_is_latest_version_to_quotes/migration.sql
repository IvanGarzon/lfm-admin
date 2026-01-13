-- Add isLatestVersion column to quotes table
ALTER TABLE "quotes" ADD COLUMN "is_latest_version" BOOLEAN NOT NULL DEFAULT true;

-- Backfill existing data: Set isLatestVersion to false for quotes that have child versions
-- A quote is NOT the latest version if it has any child versions (parent_quote_id points to it)
UPDATE "quotes"
SET "is_latest_version" = false
WHERE "id" IN (
  SELECT DISTINCT "parent_quote_id"
  FROM "quotes"
  WHERE "parent_quote_id" IS NOT NULL
    AND "deleted_at" IS NULL
);

-- Create indexes for optimal query performance
CREATE INDEX "quotes_is_latest_version_deleted_at_idx" ON "quotes"("is_latest_version", "deleted_at");
CREATE INDEX "quotes_status_is_latest_version_deleted_at_idx" ON "quotes"("status", "is_latest_version", "deleted_at");