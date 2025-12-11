-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('QUEUED', 'SENDING', 'SENT', 'FAILED', 'RETRYING');

-- CreateTable
CREATE TABLE "email_audit" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT,
    "quote_id" TEXT,
    "customer_id" TEXT,
    "email_type" TEXT NOT NULL,
    "template_name" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'QUEUED',
    "queued_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMPTZ,
    "failed_at" TIMESTAMPTZ,
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "inngest_event_id" TEXT,
    "inngest_run_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "email_audit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_audit_invoice_id_idx" ON "email_audit"("invoice_id");

-- CreateIndex
CREATE INDEX "email_audit_quote_id_idx" ON "email_audit"("quote_id");

-- CreateIndex
CREATE INDEX "email_audit_customer_id_idx" ON "email_audit"("customer_id");

-- CreateIndex
CREATE INDEX "email_audit_status_idx" ON "email_audit"("status");

-- CreateIndex
CREATE INDEX "email_audit_email_type_idx" ON "email_audit"("email_type");

-- CreateIndex
CREATE INDEX "email_audit_queued_at_idx" ON "email_audit"("queued_at");

-- CreateIndex
CREATE INDEX "email_audit_inngest_event_id_idx" ON "email_audit"("inngest_event_id");

-- AddForeignKey
ALTER TABLE "email_audit" ADD CONSTRAINT "email_audit_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_audit" ADD CONSTRAINT "email_audit_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_audit" ADD CONSTRAINT "email_audit_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
