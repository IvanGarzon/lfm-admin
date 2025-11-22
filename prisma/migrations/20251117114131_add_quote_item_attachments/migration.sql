-- CreateTable
CREATE TABLE "quote_item_attachments" (
    "id" TEXT NOT NULL,
    "quote_item_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "s3_key" TEXT NOT NULL,
    "s3_url" TEXT NOT NULL,
    "uploaded_by" TEXT,
    "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quote_item_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quote_item_attachments_s3_key_key" ON "quote_item_attachments"("s3_key");

-- CreateIndex
CREATE INDEX "quote_item_attachments_quote_item_id_idx" ON "quote_item_attachments"("quote_item_id");

-- AddForeignKey
ALTER TABLE "quote_item_attachments" ADD CONSTRAINT "quote_item_attachments_quote_item_id_fkey" FOREIGN KEY ("quote_item_id") REFERENCES "quote_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
