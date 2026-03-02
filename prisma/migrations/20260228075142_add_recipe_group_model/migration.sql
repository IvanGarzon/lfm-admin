-- CreateTable
CREATE TABLE "recipe_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "total_cost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "recipe_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_group_items" (
    "id" TEXT NOT NULL,
    "recipe_group_id" TEXT NOT NULL,
    "recipe_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "recipe_group_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recipe_groups_deleted_at_idx" ON "recipe_groups"("deleted_at");

-- CreateIndex
CREATE INDEX "recipe_group_items_recipe_group_id_idx" ON "recipe_group_items"("recipe_group_id");

-- CreateIndex
CREATE INDEX "recipe_group_items_recipe_id_idx" ON "recipe_group_items"("recipe_id");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_group_items_recipe_group_id_recipe_id_key" ON "recipe_group_items"("recipe_group_id", "recipe_id");

-- AddForeignKey
ALTER TABLE "recipe_group_items" ADD CONSTRAINT "recipe_group_items_recipe_group_id_fkey" FOREIGN KEY ("recipe_group_id") REFERENCES "recipe_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_group_items" ADD CONSTRAINT "recipe_group_items_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
