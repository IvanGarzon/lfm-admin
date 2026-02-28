-- CreateEnum
CREATE TYPE "RecipeItemType" AS ENUM ('FLORAL', 'FOLIAGE', 'SUPPLY', 'INGREDIENT', 'OTHER');

-- CreateTable
CREATE TABLE "recipes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "labor_rate" DECIMAL(5,2) NOT NULL DEFAULT 25.00,
    "target_margin" DECIMAL(5,2) NOT NULL DEFAULT 30.00,
    "total_materials_cost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "labor_cost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_production_cost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "selling_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "profit_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "profit_percentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_items" (
    "id" TEXT NOT NULL,
    "recipe_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "RecipeItemType" NOT NULL DEFAULT 'FLORAL',
    "purchase_unit" TEXT NOT NULL,
    "purchase_unit_quantity" DECIMAL(15,2) NOT NULL,
    "purchase_cost" DECIMAL(15,2) NOT NULL,
    "unit_cost" DECIMAL(15,2) NOT NULL,
    "quantity_used" DECIMAL(15,2) NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "recipe_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recipe_items_recipe_id_idx" ON "recipe_items"("recipe_id");

-- AddForeignKey
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
