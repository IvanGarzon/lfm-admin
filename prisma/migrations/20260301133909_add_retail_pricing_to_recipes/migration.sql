-- AlterTable
ALTER TABLE "recipe_items" ADD COLUMN     "retail_line_total" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "retail_price" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "recipes" ADD COLUMN     "total_retail_price" DECIMAL(15,2) NOT NULL DEFAULT 0;
