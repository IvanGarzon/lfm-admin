-- AlterTable
ALTER TABLE "quote_items" ADD COLUMN "colors" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
