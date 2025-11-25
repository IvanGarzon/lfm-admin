-- CreateTable
CREATE TABLE "quote_status_history" (
    "id" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "status" "QuoteStatus" NOT NULL,
    "previousStatus" "QuoteStatus",
    "changed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_by" TEXT,
    "notes" TEXT,

    CONSTRAINT "quote_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quote_status_history_quote_id_changed_at_idx" ON "quote_status_history"("quote_id", "changed_at");

-- AddForeignKey
ALTER TABLE "quote_status_history" ADD CONSTRAINT "quote_status_history_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
