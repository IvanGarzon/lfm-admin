-- AlterTable
-- Remove redundant status-specific fields since QuoteStatusHistory now tracks all this data
ALTER TABLE "quotes" DROP COLUMN "accepted_date",
DROP COLUMN "rejected_date",
DROP COLUMN "reject_reason",
DROP COLUMN "converted_date";
