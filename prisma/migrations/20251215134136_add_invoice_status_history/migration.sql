-- CreateTable
CREATE TABLE "invoice_status_history" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL,
    "previousStatus" "InvoiceStatus",
    "changed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_by" TEXT,
    "notes" TEXT,

    CONSTRAINT "invoice_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "invoice_status_history_invoice_id_changed_at_idx" ON "invoice_status_history"("invoice_id", "changed_at");

-- AddForeignKey
ALTER TABLE "invoice_status_history" ADD CONSTRAINT "invoice_status_history_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
