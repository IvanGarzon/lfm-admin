-- AlterTable
ALTER TABLE "quotes" ADD COLUMN     "cancel_reason" TEXT,
ADD COLUMN     "cancelled_date" TIMESTAMPTZ;

-- CreateIndex
CREATE INDEX "quotes_status_cancelled_date_idx" ON "quotes"("status", "cancelled_date");
