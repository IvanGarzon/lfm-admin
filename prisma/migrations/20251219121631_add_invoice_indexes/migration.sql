-- CreateIndex
CREATE INDEX "invoices_status_deleted_at_idx" ON "invoices"("status", "deleted_at");

-- CreateIndex
CREATE INDEX "invoices_receipt_number_idx" ON "invoices"("receipt_number");

-- CreateIndex
CREATE INDEX "invoices_customer_id_status_idx" ON "invoices"("customer_id", "status");

-- CreateIndex
CREATE INDEX "invoices_due_date_idx" ON "invoices"("due_date");
