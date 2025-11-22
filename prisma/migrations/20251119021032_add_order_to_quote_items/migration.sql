-- AlterTable
ALTER TABLE "quote_items" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- Populate order field based on created_at for existing records
-- This ensures existing items maintain their current order
WITH ordered_items AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY quote_id ORDER BY created_at ASC, id ASC) - 1 AS new_order
  FROM quote_items
)
UPDATE quote_items
SET "order" = ordered_items.new_order
FROM ordered_items
WHERE quote_items.id = ordered_items.id;

-- CreateIndex
CREATE INDEX "quote_items_quote_id_order_idx" ON "quote_items"("quote_id", "order");
