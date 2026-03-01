-- CreateTable
CREATE TABLE "price_list_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'FLORAL',
    "image_url" TEXT,
    "retailPrice" DECIMAL(15,2) NOT NULL,
    "multiplier" DECIMAL(5,2) NOT NULL DEFAULT 3,
    "cost_per_unit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "unit_type" TEXT,
    "bunch_size" INTEGER,
    "season" TEXT,
    "retail_price_per_unit" DECIMAL(15,2),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "price_list_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_list_cost_history" (
    "id" TEXT NOT NULL,
    "price_list_item_id" TEXT NOT NULL,
    "previous_cost" DECIMAL(15,2) NOT NULL,
    "new_cost" DECIMAL(15,2) NOT NULL,
    "changed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_list_cost_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "price_list_items_name_idx" ON "price_list_items"("name");

-- CreateIndex
CREATE INDEX "price_list_items_category_idx" ON "price_list_items"("category");

-- CreateIndex
CREATE INDEX "price_list_items_deleted_at_idx" ON "price_list_items"("deleted_at");

-- CreateIndex
CREATE INDEX "price_list_cost_history_price_list_item_id_changed_at_idx" ON "price_list_cost_history"("price_list_item_id", "changed_at" DESC);

-- AddForeignKey
ALTER TABLE "price_list_cost_history" ADD CONSTRAINT "price_list_cost_history_price_list_item_id_fkey" FOREIGN KEY ("price_list_item_id") REFERENCES "price_list_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
