-- CreateIndex
CREATE INDEX "quote_status_history_changed_by_idx" ON "quote_status_history"("changed_by");

-- AddForeignKey
ALTER TABLE "quote_status_history" ADD CONSTRAINT "quote_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
