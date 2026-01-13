-- CreateIndex
CREATE INDEX "invoice_status_history_changed_by_idx" ON "invoice_status_history"("changed_by");

-- AddForeignKey
ALTER TABLE "invoice_status_history" ADD CONSTRAINT "invoice_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
