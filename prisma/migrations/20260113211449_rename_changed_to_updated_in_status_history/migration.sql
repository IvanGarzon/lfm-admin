-- Rename columns in quote_status_history table
ALTER TABLE "quote_status_history" RENAME COLUMN "changed_at" TO "updated_at";
ALTER TABLE "quote_status_history" RENAME COLUMN "changed_by" TO "updated_by";

-- Rename columns in invoice_status_history table
ALTER TABLE "invoice_status_history" RENAME COLUMN "changed_at" TO "updated_at";
ALTER TABLE "invoice_status_history" RENAME COLUMN "changed_by" TO "updated_by";

-- Drop old indexes
DROP INDEX IF EXISTS "quote_status_history_quote_id_changed_at_idx";
DROP INDEX IF EXISTS "quote_status_history_changed_by_idx";
DROP INDEX IF EXISTS "invoice_status_history_invoice_id_changed_at_idx";
DROP INDEX IF EXISTS "invoice_status_history_changed_by_idx";

-- Create new indexes
CREATE INDEX "quote_status_history_quote_id_updated_at_idx" ON "quote_status_history"("quote_id", "updated_at");
CREATE INDEX "quote_status_history_updated_by_idx" ON "quote_status_history"("updated_by");
CREATE INDEX "invoice_status_history_invoice_id_updated_at_idx" ON "invoice_status_history"("invoice_id", "updated_at");
CREATE INDEX "invoice_status_history_updated_by_idx" ON "invoice_status_history"("updated_by");

-- Drop old foreign key constraints
ALTER TABLE "quote_status_history" DROP CONSTRAINT IF EXISTS "quote_status_history_changed_by_fkey";
ALTER TABLE "invoice_status_history" DROP CONSTRAINT IF EXISTS "invoice_status_history_changed_by_fkey";

-- Add new foreign key constraints
ALTER TABLE "quote_status_history" ADD CONSTRAINT "quote_status_history_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "invoice_status_history" ADD CONSTRAINT "invoice_status_history_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
