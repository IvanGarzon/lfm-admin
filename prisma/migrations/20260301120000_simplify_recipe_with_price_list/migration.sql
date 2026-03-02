-- CreateEnum
CREATE TYPE "LabourCostType" AS ENUM ('FIXED_AMOUNT', 'PERCENTAGE_OF_RETAIL', 'PERCENTAGE_OF_MATERIAL');

-- AlterTable: Recipe - Add new columns
ALTER TABLE "recipes" ADD COLUMN "labour_cost_type" "LabourCostType" NOT NULL DEFAULT 'FIXED_AMOUNT';
ALTER TABLE "recipes" ADD COLUMN "labour_amount" DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE "recipes" ADD COLUMN "total_cost" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- Migrate Recipe data: Copy labor_rate to labour_amount (as percentage), set type to PERCENTAGE_OF_MATERIAL
UPDATE "recipes" SET
  "labour_amount" = "labor_rate",
  "labour_cost_type" = 'PERCENTAGE_OF_MATERIAL',
  "total_cost" = "total_production_cost";

-- AlterTable: Recipe - Drop old columns
ALTER TABLE "recipes" DROP COLUMN "labor_rate";
ALTER TABLE "recipes" DROP COLUMN "target_margin";
ALTER TABLE "recipes" DROP COLUMN "selling_price";
ALTER TABLE "recipes" DROP COLUMN "profit_value";
ALTER TABLE "recipes" DROP COLUMN "profit_percentage";
ALTER TABLE "recipes" DROP COLUMN "total_production_cost";

-- AlterTable: RecipeItem - Add new columns
ALTER TABLE "recipe_items" ADD COLUMN "price_list_item_id" TEXT;
ALTER TABLE "recipe_items" ADD COLUMN "name" TEXT NOT NULL DEFAULT '';
ALTER TABLE "recipe_items" ADD COLUMN "quantity" DECIMAL(15,2) NOT NULL DEFAULT 1;
ALTER TABLE "recipe_items" ADD COLUMN "unit_price" DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE "recipe_items" ADD COLUMN "line_total" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- Migrate RecipeItem data: Copy description to name, quantity_used to quantity, unit_cost to unit_price, subtotal to line_total
UPDATE "recipe_items" SET
  "name" = "description",
  "quantity" = "quantity_used",
  "unit_price" = "unit_cost",
  "line_total" = "subtotal";

-- Remove default from name column now that data is migrated
ALTER TABLE "recipe_items" ALTER COLUMN "name" DROP DEFAULT;

-- AlterTable: RecipeItem - Drop old columns
ALTER TABLE "recipe_items" DROP COLUMN "description";
ALTER TABLE "recipe_items" DROP COLUMN "type";
ALTER TABLE "recipe_items" DROP COLUMN "purchase_unit";
ALTER TABLE "recipe_items" DROP COLUMN "purchase_unit_quantity";
ALTER TABLE "recipe_items" DROP COLUMN "purchase_cost";
ALTER TABLE "recipe_items" DROP COLUMN "unit_cost";
ALTER TABLE "recipe_items" DROP COLUMN "quantity_used";
ALTER TABLE "recipe_items" DROP COLUMN "subtotal";

-- CreateIndex
CREATE INDEX "recipe_items_price_list_item_id_idx" ON "recipe_items"("price_list_item_id");

-- AddForeignKey
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_price_list_item_id_fkey" FOREIGN KEY ("price_list_item_id") REFERENCES "price_list_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
