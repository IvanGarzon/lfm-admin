-- CreateIndex
CREATE INDEX "documents_kind_idx" ON "documents"("kind");

-- CreateIndex
CREATE INDEX "invoice_items_product_id_idx" ON "invoice_items"("product_id");

-- CreateIndex
CREATE INDEX "payments_invoice_id_date_idx" ON "payments"("invoice_id", "date");

-- CreateIndex
CREATE INDEX "quote_items_product_id_idx" ON "quote_items"("product_id");

-- CreateIndex
CREATE INDEX "quotes_customer_id_status_idx" ON "quotes"("customer_id", "status");

-- CreateIndex
CREATE INDEX "quotes_status_deleted_at_idx" ON "quotes"("status", "deleted_at");

-- CreateIndex
CREATE INDEX "quotes_valid_until_idx" ON "quotes"("valid_until");

-- CreateIndex
CREATE INDEX "quotes_parent_quote_id_idx" ON "quotes"("parent_quote_id");

-- CreateIndex
CREATE INDEX "quotes_customer_id_issued_date_idx" ON "quotes"("customer_id", "issued_date" DESC);

-- CreateIndex
CREATE INDEX "quotes_deleted_at_idx" ON "quotes"("deleted_at");
