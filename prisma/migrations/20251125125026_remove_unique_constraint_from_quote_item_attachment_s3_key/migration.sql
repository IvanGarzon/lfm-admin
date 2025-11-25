-- DropIndex
DROP INDEX "quote_item_attachments_s3_key_key";

-- CreateIndex
CREATE INDEX "quote_item_attachments_s3_key_idx" ON "quote_item_attachments"("s3_key");
