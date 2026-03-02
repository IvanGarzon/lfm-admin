-- AlterTable: Rename labor_cost to labour_cost
ALTER TABLE "recipes" RENAME COLUMN "labor_cost" TO "labour_cost";

-- AlterTable: Add new columns to recipes
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "selling_price" DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "round_price" BOOLEAN DEFAULT false;
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "rounding_method" TEXT DEFAULT 'NEAREST';
